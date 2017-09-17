FROM postgres:alpine
LABEL maintainer='butlerx <cian@coderdojo.org>'
ENV POSTGRES_USER=platform POSTGRES_PASSWORD=QdYx3D5y
RUN mkdir /db
COPY dump /db
