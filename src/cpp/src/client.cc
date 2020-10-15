#include "client.h"

auto wrapConnection(SSL *ssl) {
    return [ssl](const Napi::CallbackInfo &info) {
        auto message = info[0].As<Napi::String>().Utf8Value();
        auto len = message.length();
        SSL_write(ssl, static_cast<char *>(static_cast<void *>(&len)), sizeof(size_t));
        SSL_write(ssl, message.c_str(), len);
    };
}

int AsyncConnection::initConnection() {
    // resolve host
    auto host = gethostbyname(hostname.c_str());
    if (!host) {
        SetError("Failed to get hostname " + hostname + ": " + std::string(strerror(h_errno)));
        return -1;
    }
    // server socket address
    auto in = sockaddr_in();
    in.sin_family = AF_INET;
    in.sin_port = htons(port);
    in.sin_addr.s_addr = *(long *) (host->h_addr);
    // create client socket
    auto sd = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sd == -1) {
        SetError("Failed to create socket: " + std::string(strerror(errno)));
        return -1;
    }
    // connect to server
    if (::connect(sd, (struct sockaddr *) &in, sizeof(in))) {
        close(sd);
        SetError("Failed to connect " + hostname + ": " + std::string(strerror(errno)));
        return -1;
    }
    return sd;
}

AsyncConnection::AsyncConnection(Napi::Function &callback, SSL_CTX *clientContext, std::string hostname, int port)
    : AsyncWorker(callback),
      clientContext(clientContext),
      hostname(std::move(hostname)),
      port(port) {}

void AsyncConnection::Execute() {
    auto connection = initConnection();
    if (connection == -1) {
        return;
    }
    // create SSL structure for connection
    ssl = SSL_new(clientContext);
    SSL_set_fd(ssl, connection);
    if (SSL_connect(ssl) == -1) {
        SetError("Failed to connect");
        return;
    }
}

void AsyncConnection::OnOK() {
    auto obj = Napi::Object::New(Env());
    obj.Set(Napi::String::New(Env(), "sendMessage"), Napi::Function::New(Env(), wrapConnection(ssl)));
    Callback().Call({Env().Null(), obj});
}

Client::Client(const Napi::CallbackInfo &info) : ObjectWrap(info), env(info.Env()) {
    clientContext = createSSLContext(env, false);
}

Napi::Value Client::connect(const Napi::CallbackInfo &info) {
    auto hostname = info[0].As<Napi::String>().Utf8Value();
    auto port = info[1].As<Napi::Number>().Uint32Value();
    auto callback = info[2].As<Napi::Function>();
    (new AsyncConnection(callback, clientContext, hostname, port))->Queue();
    return env.Undefined();
}

Napi::Function Client::getClass(Napi::Env env) {
    return DefineClass(env, "Client", {
        InstanceMethod("connect", &Client::connect),
    });
}
