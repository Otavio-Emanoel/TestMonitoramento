package server

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"arbitrage-engine/internal/engine"
	"arbitrage-engine/internal/model"
)

// Server wraps the Engine and exposes HTTP endpoints.
type Server struct {
	eng    *engine.Engine
	router *http.ServeMux
}

// New creates and registers all routes.
func New(eng *engine.Engine) *Server {
	s := &Server{
		eng:    eng,
		router: http.NewServeMux(),
	}
	s.routes()
	return s
}

// Handler returns the root HTTP handler (middleware chain applied).
func (s *Server) Handler() http.Handler {
	return logging(cors(s.router))
}

// ── Routes ───────────────────────────────────────────────────────────────────

func (s *Server) routes() {
	s.router.HandleFunc("GET /api/v1/scanner/opportunities", s.handleOpportunities)
	s.router.HandleFunc("GET /api/v1/health", s.handleHealth)
}

// handleOpportunities returns the latest arbitrage snapshot.
//
//	GET /api/v1/scanner/opportunities
func (s *Server) handleOpportunities(w http.ResponseWriter, r *http.Request) {
	snap := s.eng.Snapshot()
	writeJSON(w, http.StatusOK, snap)
}

// handleHealth is a liveness probe endpoint.
//
//	GET /api/v1/health
func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

// ── Helpers ──────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, model.ScannerResponse{
		Count: 0,
		Data:  []model.Opportunity{},
	})
	log.Printf("error response %d: %s", status, msg)
}

// ── Middleware ───────────────────────────────────────────────────────────────

// logging logs method, path, status, and duration for every request.
func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rw.status, time.Since(start))
	})
}

// cors adds permissive CORS headers for the frontend.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture the status code.
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(status int) {
	rw.status = status
	rw.ResponseWriter.WriteHeader(status)
}

// ── Unused export kept for backward compat ───────────────────────────────────
var _ = writeError
