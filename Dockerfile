FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod ./
COPY cmd ./cmd
COPY public ./public
RUN go build -o /app/server ./cmd/server

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/server /app/server
COPY public ./public
EXPOSE 9001
CMD ["/app/server"]
