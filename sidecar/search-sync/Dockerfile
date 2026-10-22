# ── Stage 1: Build static binary ──────────────────────────────────────
FROM golang:1.26.10-alpine AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY main.go .
RUN CGO_ENABLED=0 GOFLAGS="-trimpath" \
    go build -ldflags="-s -w" -o /search-sync .

# ── Stage 2: Scratch runtime (~5 MB) ─────────────────────────────────
FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /search-sync /search-sync

ENTRYPOINT ["/search-sync"]
