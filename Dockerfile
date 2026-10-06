# Static REST API client served by Nginx
FROM nginx:1.27-alpine

# Default API endpoint (override at runtime via the API_BASE_URL env var)
ENV API_BASE_URL=https://brian.aselaboratory.com/api/items

# Nginx's entrypoint runs envsubst on /etc/nginx/templates/*.template
# and writes the result to /etc/nginx/conf.d/ on every container start.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

COPY index.html style.css script.js /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
