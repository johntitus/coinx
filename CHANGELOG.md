# Change Log
All notable changes to this project will be documented in this file.

## 0.11.0 - 2017-08-29
- Fixes display of funds for IOT and CH (aka IOTA and BCH).

## 0.10.1 - 2017-07-23
- Fixes a bug where `coinx funds -c` would terminate if any of the exchanges did not have that currency.

## 0.10.0 - 2017-07-23
- Adds `coinx action` to run custom scripts that make use of coinx-core. 
- Adds buyallthecoins action. Lets you buy the top crypto coins in an automated fashion.

## 0.9.0 - 2017-07-22
- Adds `lock` and `unlock`, which will encrypt and decrypt the coinx file that contains your API keys.

## 0.8.0
- Adds logging. Closes issue #16.
- Rewrite of the configuration part that allows to add more markets quicker (thanks @AlexandrFox)
- Fixes version display number (thanks @driftfox)


## 0.7.1
Arbitrarily large version increase :)
- Fixes issues 5 & 6 (output bugs when buying)
- Fixes issue 13 thanks to @driftfox (windows/linux differences issue)
- Implements issue 7 (support for coin names). Requires you do run `coinx update`.
- Uses coinmarketcap.com to get a "real" price for BTC in USD.
- Starts this file.

## 0.1.0
Initial release
