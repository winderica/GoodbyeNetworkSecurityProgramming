#ifndef _CLIENT_H
#define _CLIENT_H

#include <libnet.h>
#include "ssl.h"

class AsyncConnection : public Napi::AsyncWorker {
private:
    SSL_CTX *clientContext;
    std::string hostname;
    int port;
    SSL* ssl = nullptr;

    int initConnection();

public:
    AsyncConnection(Napi::Function &callback, SSL_CTX *clientContext, std::string hostname, int port);

    ~AsyncConnection() override = default;

    void Execute() override;

    void OnOK() override;
};

class Client : public Napi::ObjectWrap<Client> {
    Napi::Env env;
    SSL_CTX *clientContext;

public:
    explicit Client(const Napi::CallbackInfo &info);

    Napi::Value connect(const Napi::CallbackInfo &info);

    static Napi::Function getClass(Napi::Env env);
};

#endif //_CLIENT_H
