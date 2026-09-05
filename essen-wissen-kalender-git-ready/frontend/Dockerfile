FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY public /usr/share/nginx/html
RUN chmod 777 /tmp
EXPOSE 8888
CMD ["nginx", "-g", "daemon off;"]
