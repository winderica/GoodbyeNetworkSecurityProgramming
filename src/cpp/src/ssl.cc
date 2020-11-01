#include "ssl.h"

int verifyCallback(int status, X509_STORE_CTX *ctx) {
    // check status
    if (status != 1) {
        std::cerr << "Failed to verify: " << X509_verify_cert_error_string(X509_STORE_CTX_get_error(ctx)) << std::endl;
        return 0;
    }
    // display cert info
    auto cert = X509_STORE_CTX_get_current_cert(ctx);
    std::cout << "Peer certificate:" << std::endl
              << "Subject: " << X509_NAME_oneline(X509_get_subject_name(cert), nullptr, 0) << std::endl
              << "Issuer: " << X509_NAME_oneline(X509_get_issuer_name(cert), nullptr, 0) << std::endl;
    return 1;
}

SSL_CTX *createSSLContext(Napi::Env env, bool isServer) {
    // init OpenSSL
    SSL_library_init();
    OpenSSL_add_all_algorithms();
    SSL_load_error_strings();
    // create SSL context
    auto ctx = SSL_CTX_new(isServer ? TLS_server_method() : TLS_client_method());
    if (!ctx) {
        if (isServer) {
            Napi::Error::Fatal("createSSLContext", "Failed to initialize SSL");
        }
        Napi::Error::New(env, "Failed to initialize SSL").ThrowAsJavaScriptException();
        return nullptr;
    }
    // enable verification and load CA
    SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, verifyCallback);
    if (SSL_CTX_load_verify_locations(ctx, CA.c_str(), nullptr) < 1) {
        SSL_CTX_free(ctx);
        if (isServer) {
            Napi::Error::Fatal("createSSLContext", ("Failed to load " + CA).c_str());
        }
        Napi::Error::New(env, "Failed to load " + CA).ThrowAsJavaScriptException();
        return nullptr;
    }
    // load certificate and private key
    if (SSL_CTX_use_certificate_file(ctx, CERT.c_str(), SSL_FILETYPE_PEM) <= 0) {
        SSL_CTX_free(ctx);
        if (isServer) {
            Napi::Error::Fatal("createSSLContext", ("Failed to load " + CERT).c_str());
        }
        Napi::Error::New(env, "Failed to load " + CERT).ThrowAsJavaScriptException();
        return nullptr;
    }
    if (SSL_CTX_use_PrivateKey_file(ctx, KEY.c_str(), SSL_FILETYPE_PEM) <= 0) {
        SSL_CTX_free(ctx);
        if (isServer) {
            Napi::Error::Fatal("createSSLContext", ("Failed to load " + KEY).c_str());
        }
        Napi::Error::New(env, "Failed to load " + KEY).ThrowAsJavaScriptException();
        return nullptr;
    }
    if (!SSL_CTX_check_private_key(ctx)) {
        SSL_CTX_free(ctx);
        if (isServer) {
            Napi::Error::Fatal("createSSLContext", ("Failed to load " + CERT).c_str());
        }
        Napi::Error::New(env, KEY + " doesn't match " + CERT).ThrowAsJavaScriptException();
        return nullptr;
    }
    return ctx;
}
