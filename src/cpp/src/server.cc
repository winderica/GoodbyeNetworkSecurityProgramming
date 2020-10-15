#include "server.h"

int Server::initServer(int port) {
    // server socket address
    auto in = sockaddr_in();
    in.sin_family = AF_INET;
    in.sin_port = htons(port);
    in.sin_addr.s_addr = INADDR_ANY;
    // create server socket
    auto sd = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sd == -1) {
        Napi::Error::Fatal("initServer", strerror(errno));
    }
    // assign address to sd
    if (bind(sd, (struct sockaddr *) &in, sizeof(in)) == -1) {
        close(sd);
        Napi::Error::Fatal("initServer", strerror(errno));
    }
    // listen on sd, max queue size is 10
    if (listen(sd, 10) == -1) {
        close(sd);
        Napi::Error::Fatal("initServer", strerror(errno));
    }
    return sd;
}

void Server::finalizerCallback(Napi::Env env, void *, ServerContext *context) {
    context->nativeThread.join();
    context->deferred.Resolve(Napi::Boolean::New(env, true));
    delete context;
}

void Server::runServer(ServerContext *context, int port) {
    std::unordered_set<SSL *> clients;

    auto callback = [](Napi::Env env, Napi::Function emit, std::unordered_map<std::string, std::string> *object) {
        auto obj = Napi::Object::New(env);
        for (const auto &[key, value]: *object) {
            if (key != "type") {
                obj.Set(Napi::String::New(env, key), Napi::String::New(env, value));
            }
        }
        emit.Call({Napi::String::New(env, object->at("type")), obj});
    };
    // preparations
    auto server = initServer(port);
    auto ctx = createSSLContext(env, true);
    if (!ctx) {
        return;
    }

    context->data = {{{"type", "start"}}};
    if (context->fn.BlockingCall(&context->data, callback) != napi_ok) {
        Napi::Error::Fatal("runServer", "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
    }
    fd_set readFDSet;
    while (true) {
        FD_ZERO(&readFDSet);
        FD_SET(server, &readFDSet);
        for (const auto ssl: clients) {
            FD_SET(SSL_get_fd(ssl), &readFDSet);
        }
        select(FD_SETSIZE, &readFDSet, nullptr, nullptr, nullptr);
        if (FD_ISSET(server, &readFDSet)) { // new connection
            // accept it
            struct sockaddr_in in{};
            socklen_t size = sizeof(in);
            auto connection = accept(server, (struct sockaddr *) &in, &size);
            // and create SSL structure for it
            auto ssl = SSL_new(ctx);
            SSL_set_fd(ssl, connection);
            if (SSL_accept(ssl) == -1) {
                context->data = {{{"type", "error"}, {"message", "Failed to accept"}}};
                if (context->fn.BlockingCall(&context->data, callback) != napi_ok) {
                    Napi::Error::Fatal("ThreadEntry", "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
                }
                continue;
            }
            context->data = {{{"type", "connection"}, {"ip", inet_ntoa(in.sin_addr)}}};
            if (context->fn.BlockingCall(&context->data, callback) != napi_ok) {
                Napi::Error::Fatal("ThreadEntry", "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
            }
            clients.emplace(ssl);
        } else {
            SSL *sslToRemove = nullptr;
            for (const auto ssl: clients) {
                sslToRemove = nullptr;
                auto connection = SSL_get_fd(ssl);
                if (!FD_ISSET(connection, &readFDSet)) { // no data from client
                    continue;
                }
                struct sockaddr_in in;
                socklen_t size = sizeof(in);
                getpeername(connection, (struct sockaddr *) &in, &size);

                char totalLenBuf[sizeof(size_t)] = {0};
                auto len = SSL_read(ssl, totalLenBuf, sizeof(totalLenBuf));
                auto totalLen = *((size_t *) totalLenBuf);
                auto data = std::string();
                if (len <= 0) { // client disconnected
                    auto error = SSL_get_error(ssl, len);
                    if (error == SSL_ERROR_SSL || error == SSL_ERROR_SYSCALL || error == SSL_ERROR_ZERO_RETURN) {
                        context->data = {{{"type", "disconnection"}, {"ip", inet_ntoa(in.sin_addr)}}};
                        if (context->fn.BlockingCall(&context->data, callback) != napi_ok) {
                            Napi::Error::Fatal("ThreadEntry",
                                               "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
                        }
                        sslToRemove = ssl;
                        break;
                    }
                }
                auto buf = std::string(65536, 0);
                while (auto l = SSL_read(ssl, buf.data(), buf.size())) {
                    if (l <= 0) {
                        break;
                    }
                    data.insert(data.end(), buf.begin(), buf.begin() + l);
                    totalLen -= l;
                    if (totalLen <= 0) {
                        break;
                    }
                }
                context->data = {{{"type", "message"}, {"data", data}, {"ip", inet_ntoa(in.sin_addr)}}};
                if (context->fn.BlockingCall(&context->data, callback) != napi_ok) {
                    Napi::Error::Fatal("ThreadEntry", "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
                }
            }
            if (sslToRemove) {
                // clean up
                auto connection = SSL_get_fd(sslToRemove);
                clients.erase(sslToRemove);
                if (!errno) {
                    SSL_shutdown(sslToRemove);
                }
                SSL_free(sslToRemove);
                shutdown(connection, SHUT_RDWR);
                close(connection);
            }
        }
    }
    context->fn.Release();
}

Server::Server(const Napi::CallbackInfo &info) : ObjectWrap(info), env(info.Env()) {
}

Napi::Function Server::getClass(Napi::Env env) {
    return DefineClass(env, "Server", {
        InstanceMethod("serve", &Server::serve),
    });
}

Napi::Value Server::serve(const Napi::CallbackInfo &info) {
    auto context = new ServerContext(env);
    context->fn = Napi::ThreadSafeFunction::New(
        info.Env(),
        info[1].As<Napi::Function>(),
        "server",
        0,
        1,
        context,
        finalizerCallback,
        (void *) nullptr
    );
    auto port = info[0].As<Napi::Number>().Uint32Value();
    context->nativeThread = std::thread(&Server::runServer, this, context, port);
    return context->deferred.Promise();
}
