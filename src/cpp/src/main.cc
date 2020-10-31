#include "server.h"
#include "client.h"

std::string CA;
std::string CERT;
std::string KEY;

void init(const Napi::CallbackInfo &info) {
    CA = info[0].As<Napi::String>().Utf8Value();
    CERT = info[1].As<Napi::String>().Utf8Value();
    KEY = info[2].As<Napi::String>().Utf8Value();
    SSL_CTX_free(createSSLContext(info.Env(), false));
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, init));
    exports.Set(Napi::String::New(env, "Client"), Client::getClass(env));
    exports.Set(Napi::String::New(env, "Server"), Server::getClass(env));
    return exports;
}

NODE_API_MODULE(hello, Init)