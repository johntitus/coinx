# coinx
A command-line tool to interact with multiple crypto-currencies exchanges. Buy, sell, find the best price, and check your exchange balances.

## Install
Install it globally on your computer.
`npm install -g coinx`

## Supported Exchanges
Currently: Kraken, Poloniex, Bitfinex, Liqui, Bittrex. 

## Configure
The tool uses your exchange API keys to make requests and queries. You'll have to get your API keys from each exchange manually, but then you can store it in the tool by using the `config` command.
```bash
$ coinx config kraken
? Kraken API Key abcd
? Kraken API Secret efgh
Saved data for Kraken
```

Note: Your API Keys and Secrets are stored in your operating system home directory in a `coinx` directory as a JSON file.

## Coin Price
Get the price of any crypto-currency by using the coin's symbol. Bitcoin is shown in US Dollars, all other coins are shown in BTC and in US Dollars.

For example, to get the price of Bitcoin:
```bash
$ coinx price btc
Getting prices for BTC...
Exchange Price in USD
Liqui        $2419.87
Bitfinex     $2429.68
Poloniex     $2431.92
Bittrex      $2442.46
Kraken       $2454.00
                     
Average      $2435.59
```
Or, to get the price of Etherium:
```bash
$ coinx price eth
Getting prices for ETH...
Exchange Price in BTC Price in USD
Bittrex    0.11339041      $275.69
Poloniex   0.11353471      $276.04
Bitfinex   0.11360000      $276.20
Kraken     0.11367900      $276.39
Liqui      0.11460000      $278.63
                                  
Average    0.11376082      $276.59
```

Or, for Siacoin:
```bash
$ coinx price sc
Getting prices for SC...
Exchange Price in BTC Price in USD
Bittrex    0.00000564        $0.01
Poloniex   0.00000566        $0.01
                                  
Average    0.00000565        $0.01
```

## Check Exchange Funds
Check your balances on the exchanges.

```bash
$ coinx funds
Getting balances...

Poloniex
Coin          Count
ARDR    18.48537732
BCN      2.85258566

Liqui
Coin         Count
BTC     0.00016854

Bittrex
Coin         Count
1ST    10.10023974
```
Options:
```bash
$ coinx funds --help
Options:

    -e, --exchange [name]  Get balances at the specified exchange.
    -a, --alphabetically   Sort the balance list alphabetically.
    -n, --numerically      Sort the balance list by the number of coins, descending.
    -c, --coin [symbol]    Only get balances for this coin.
```
For example, to check balances only on Poloniex:
```bash
$ coinx funds -e poloniex
Getting balances on Poloniex...
Poloniex
Coin          Count
ARDR     6.48537732
BCN      2.85258566
```
Or, to check how many BTC you have on all the exchanges:
```bash
$ coinx funds -c btc
Getting balances...
Poloniex
Coin      Count
BTC  0.00076948

Liqui
Coin      Count
BTC  0.00086854

Bittrex
Coin      Count
BTC  0.00057939

Bitfinex
Coin      Count
BTC  0.00098090
```
## Buy Coins
Buy a coin by specifying, in US dollars, how much you want to spend. Note that BTC is what will actually be spent! You must have the necessary BTC available on the exchange for the purchase to go through.

Coinx will automatically use the exchange with the best rate, unless you specify an exchange to use via the `--exchange` option.

Before the purchase goes through, you'll be asked to confirm.

For example, to buy $2 worth of AntShares at the best available price:
```bash
$ coinx buy ans -$ 2
Checking ANS on the markets...
Best price found on Bittrex at $8.14

*Note that the number of coins may change slightly if the market fluctuates*
? Buy about 0.24562982 worth of ANS? Yes
Buying...
Order complete!
Bittrex order number xxxxx-xxxxx-xxxxxxx
Bought 0.2461696 ANS
Worth about $2.00
```

Or, to buy $2 worth of Ethereum on the Liqui exchange:
```bash
$ coinx buy eth -e liqui -$ 2
Checking ETH on the markets...
Best price found on Liqui at $278.70

*Note that the number of coins may change slightly if the market fluctuates*

? Buy about 0.00717629 worth of ETH? Yes
Buying...
Order complete!
Liqui order number 0
Bought 0.00717629 ETH
Worth about $2.00
```

## Sell Coins
Coming soon.