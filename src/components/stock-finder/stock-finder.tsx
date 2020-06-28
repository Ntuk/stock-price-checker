import { Component, h, State, Event, EventEmitter, Prop } from "@stencil/core";
import { AV_API_KEY } from '../../global/global';

@Component({
  tag: 'uc-stock-finder',
  styleUrl: './stock-finder.css',
  shadow: true,
})

export class StockFinder {
  stockNameInput: HTMLInputElement;

  @State() searchResults: {symbol: string, name: string}[] = [];
  @State() loading = false;
  @State() stockUserInput: string;
  @State() stockInputValid = false;

  @Prop() placeholder: string;

  @Event({bubbles: true, composed: true}) ucSymbolSelected: EventEmitter<string>;

  onFindStocks(event: Event) {
    event.preventDefault();
    this.loading = true;
    const stockName = this.stockNameInput.value;
    fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${stockName}&apikey=${AV_API_KEY}`)
      .then(res => res.json())
      .then(parsedRes => {
        this.searchResults = parsedRes['bestMatches'].map(match => {
          return { name: match['2. name'], symbol: match['1. symbol'] };
        });
        this.loading = false;
      })
      .catch(err => {
        console.log(err);
        this.loading = false;
      });
  }

  onSelectSymbol(symbol: string) {
    this.ucSymbolSelected.emit(symbol);
  }

  onUserInput(event: Event) {
    this.stockUserInput = (event.target as HTMLInputElement).value;
    this.stockUserInput.trim() !== '' ? this.stockInputValid = true : this.stockInputValid = false;
  }

  render() {
    let content = (
    <ul>
      {this.searchResults.map(result => (
        <li onClick={this.onSelectSymbol.bind(this, result.symbol)}>
          <strong>{result.symbol}</strong> - {result.name}
        </li>
      ))}
    </ul>
    );

    if (this.loading) {
      content = <uc-spinner/>;
    }

    return [
      <form onSubmit={this.onFindStocks.bind(this)}>
      <p>Look for a symbol using keywords</p>
        <input 
          id="stock-symbol" 
          ref={el => this.stockNameInput = el}
          value={this.stockUserInput}
          onInput={this.onUserInput.bind(this)}
          placeholder={this.placeholder}
        />
        <button 
          type="submit" 
          disabled={!this.stockInputValid || this.loading}
        >Find!</button>
      </form>,
      content
    ];
  }
}