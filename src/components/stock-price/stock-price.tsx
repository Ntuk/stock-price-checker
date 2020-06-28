import { Component, Element, h, State, Prop, Watch, Listen } from "@stencil/core";
import { AV_API_KEY } from '../../global/global';

@Component({
  tag: 'uc-stock-price',
  styleUrl:'./stock-price.css',
  shadow: true,
})
export class StockPrice {

  stockInput: HTMLInputElement;
  // initialStockSymbol: string;

  @Element() el: HTMLElement;

  @State() fetchedPrice: number;
  @State() fetchedChangePercent: string;
  @State() stockUserInput: string;
  @State() stockInputValid = false;
  @State() error: string;
  @State() loading = false;

  @Prop() placeholder: string;

  @Prop({mutable: true, reflectToAttr: true}) stockSymbol: string;

  @Watch('stockSymbol')
  stockSymbolChanged(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.stockUserInput = newValue;
      this.stockInputValid = true;
      this.fetchStockPrice(newValue);
    }
  }

  onUserInput(event: Event) {
    this.stockUserInput = (event.target as HTMLInputElement).value;
    this.stockUserInput.trim() !== '' ? this.stockInputValid = true : this.stockInputValid = false;
  }

  onFetchStockPrice(event: Event) {
    event.preventDefault();
    // const stockSymbol = (this.el.shadowRoot.querySelector('#stock-symbol') as HTMLInputElement).value;
    this.stockSymbol = this.stockInput.value;
    // this.fetchStockPrice(stockSymbol);
  }

  componentDidLoad() {
    if (this.stockSymbol) {
      // this.initialStockSymbol = this.stockSymbol;
      this.stockUserInput = this.stockSymbol;
      this.stockInputValid = true;
      this.fetchStockPrice(this.stockSymbol);
    }
  }

  @Listen('ucSymbolSelected', { target: 'body' })
  onStockSymbolSelected(event: CustomEvent) {
    if (event.detail && event.detail !== this.stockSymbol) {
      this.stockSymbol = event.detail;
    }
  }

  fetchStockPrice(stockSymbol: string) {
    this.loading = true;
    fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockSymbol}&apikey=${AV_API_KEY}`
    )
      .then(res => {
        return res.json();
      })
      .then(parsedRes => {
        if (!parsedRes['Global Quote']) {
          throw new Error('Symbol not found');
        }
        this.error = null;
        this.fetchedPrice = +parsedRes['Global Quote']['05. price'];
        this.fetchedChangePercent = parsedRes['Global Quote']['10. change percent'];
        this.loading = false;
      })
      .catch(err => {
        this.error = err.message;
        this.fetchedPrice = null;
        this.fetchedChangePercent = null;
        this.loading = false;
      });
  }

  hostData() {
    return { class: this.error ? 'hydrated error' : 'hydrated' };
  }

  render () {
    let dataContent = <p>Please enter a symbol</p>;
    if (this.error) {
      dataContent = <p>{this.error}</p>
    };
    if (this.fetchedPrice) {
      dataContent = (
        <div>
          <p>Price ($): {this.fetchedPrice}</p>
          <hr/>
          <p class={this.fetchedChangePercent.startsWith('-') ? 'red' : 'green'}>Change percent: {this.fetchedChangePercent}</p>
        </div>
      )
    };
    if (this.loading) {
      dataContent = <uc-spinner></uc-spinner>;
    }

    return [
      <form onSubmit={this.onFetchStockPrice.bind(this)}>
        <p>Enter a symbol to search for a stock price</p>
        <input 
          id="stock-symbol" 
          ref={el => this.stockInput = el} 
          value={this.stockUserInput}
          onInput={this.onUserInput.bind(this)}
          placeholder={this.placeholder}
        />
        <button 
          type="submit" 
          disabled={!this.stockInputValid || this.loading}
        >Fetch</button>
      </form>,
      <div>{dataContent}</div>
    ]
  }
}