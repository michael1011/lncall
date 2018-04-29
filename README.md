# lncall [![npm](https://img.shields.io/npm/v/lncall.svg)](https://www.npmjs.com/package/lncall) [![dependencies status](https://david-dm.org/michael1011/lncall/status.svg)](https://david-dm.org/michael1011/lncall)
Monetize your API with the [Lightning Network Daemon](https://github.com/lightningnetwork/lnd). This project is literally the same as [paypercall](https://github.com/ElementsProject/paypercall) but for LND instead of c-lightning.

lncall can be used as library for node.js or as reverse proxy for your existing API.

## Library
You can implement lncall directly into your node.js application. Please note that if you want to use the `middleware` function you have to use [express](https://www.npmjs.com/package/express). If you don't want to use express you can handle the tokens lncall generates yourself because `middleware` is just a wrapper of the other functions of lncall.

You can find an example for using lncall [here](https://github.com/michael1011/lncall/blob/master/example/example.js).

## Reverse proxy
lncall can also be used as reverse proxy. The rates have to be a JSON string with the API URL as key and the amount you want to charge in Satoshis as value. It could look like this:

```
{
    "/sms": 125,
    "/test": 1
}
```