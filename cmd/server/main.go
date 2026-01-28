package main

import (
	"log"
	"net/http"
	"path/filepath"
)

func main() {
	mux := http.NewServeMux()

	staticDir := http.Dir("./public")
	fileServer := http.FileServer(staticDir)
	indexPath := filepath.Join("public", "index.html")

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			file, err := staticDir.Open(r.URL.Path)
			if err != nil {
				http.ServeFile(w, r, indexPath)
				return
			}
			file.Close()
		}
		fileServer.ServeHTTP(w, r)
	})

	addr := ":9001"
	log.Printf("server started on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
