# coinx
A command-line tool to interact with multiple crypto-currencies exchanges. Buy, sell, find the best price, and check your exchange balances.

## Install
Install it globally on your computer.
`npm install -g coinx`

## Upgrade to the latest version
Coinx is currently at version 0.7.1.  You can upgrade with npm:
`npm update -g coinx`

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

## Update
Use `coinx update` to update coinx with the latest list of coins from [coinmarketcap.com](https://coinmaketcap.com). 

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
Getting prices for Ethereum (ETH)...
Exchange Price in BTC Price in USD
Liqui      0.08789270      $208.30
Poloniex   0.08809500      $208.78
Kraken     0.08811500      $208.82
Bitfinex   0.08821900      $209.07
Bittrex    0.08840483      $209.51
                                  
Average    0.08814531      $208.89
```

Or, for Siacoin:
```bash
$ coinx price sc
Getting prices for Siacoin (SC)...
Exchange Price in BTC Price in USD
Bittrex    0.00000335        $0.01
Poloniex   0.00000333        $0.01
                                  
Average    0.00000334        $0.01
```

## Check Exchange Funds
Check your balances on the exchanges.

```bash
$ coinx funds
Getting balances...
Poloniex
Name             Symbol          Count Value USD
Bitcoin          BTC        0.03227520    $76.51
Siacoin          SC      2465.11765598    $19.46
NEM              XEM      151.10258763    $18.43
Dash             DASH       0.09817530    $16.94

...
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
For example, to check balances only on Liqui:
```bash
$ coinx funds -e poloniex
Getting balances on Liqui...
Liqui
Name                  Symbol        Count Value USD
Bitcoin               BTC      0.02564645    $30.77
Ethereum              ETH      0.08706164    $18.04
Augur                 REP      0.66674308    $13.59
MobileGo              MGO     17.23038495    $13.33
...
```
Or, to check how many BTC you have on all the exchanges:
```bash
$ coinx funds -c btc
Getting balances...
Poloniex
Name    Symbol      Count Value USD
Bitcoin BTC    0.00227520    $6.53
Total                        $6.53
Kraken
Name    Symbol      Count Value USD
Bitcoin BTC    0.00237879    $6.40
Total                        $6.40
Liqui
Name    Symbol      Count Value USD
Bitcoin BTC    0.00256464    $6.81
Total                        $6.81


```
## Buy Coins
Buy a coin by specifying, in US dollars, how much you want to spend. Note that BTC is what will actually be spent! You must have the necessary BTC available on the exchange for the purchase to go through.

Coinx will automatically use the exchange with the best rate, unless you specify an exchange to use via the `--exchange` option.

Before the purchase goes through, you'll be asked to confirm.

For example, to buy $2 worth of AntShares at the best available price:
```bash
$ coinx buy ans -$ 2
Checking AntShares (ANS) on the markets...
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
Checking Ethereum (ETH) on the markets...
Best price found on Liqui at $278.70

*Note that the number of coins may change slightly if the market fluctuates*

? Buy about 0.00717629 worth of ETH? Yes
Buying...
Order complete!
Liqui order number 0
Bought 0.00717629 ETH
Worth about $2.00
```
The results of all purchases are logged into `{home folder}/coinx/log.csv`.
## Sell Coins
Coming soon.