#ifndef _SERVER_H
#define _SERVER_H

#include <libnet.h>
#include <unordered_set>
#include <thread>
#include "ssl.h"

class ServerContext {
public:
    std::unordered_map<std::string, std::string> data;

    Napi::Promise::Deferred deferred;
    std::thread nativeThread;
    Napi::ThreadSafeFunction fn;

    explicit ServerContext(Napi::Env env) : deferred(Napi::Promise::Deferred::New(env)) {
    };
};

class Server : public Napi::ObjectWrap<Server> {
private:
    Napi::Env env;

    int initServer(int port);

    void runServer(ServerContext *context, int port);

    static void finalizerCallback(Napi::Env env, void *, ServerContext *context);

public:
    explicit Server(const Napi::CallbackInfo &info);

    static Napi::Function getClass(Napi::Env env);

    Napi::Value serve(const Napi::CallbackInfo &info);
};

#endif //_SERVER_H
