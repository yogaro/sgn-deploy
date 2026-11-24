# Stack variant of the Directory FE: proxies /api/ to the directory service itself, since a stack domain points at one
# container. BASE: the plain image built with VITE_DIRECTORY_SERVICE_URL=/api.
ARG BASE
FROM ${BASE}
ENV DIRECTORY_UPSTREAM=http://directory:8080 NGINX_RESOLVER=127.0.0.11
ENV NGINX_ENVSUBST_FILTER=^(DIRECTORY_UPSTREAM|NGINX_RESOLVER)$
RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/stack/directory-fe.conf.template /etc/nginx/templates/default.conf.template
