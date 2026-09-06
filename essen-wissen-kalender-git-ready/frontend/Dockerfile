FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY public /usr/share/nginx/html
RUN chown -R 101:101 /usr/share/nginx/html
USER 101:101
EXPOSE 8888
CMD ["nginx", "-g", "daemon off;"]