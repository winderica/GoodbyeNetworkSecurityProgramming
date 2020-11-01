#ifndef _SSL_H
#define _SSL_H

#include <napi.h>
#include <bits/stdc++.h>
#include <openssl/ssl.h>
#include <openssl/err.h>

extern std::string CA;
extern std::string CERT;
extern std::string KEY;

SSL_CTX *createSSLContext(Napi::Env env, bool isServer);

#endif //_SSL_H
