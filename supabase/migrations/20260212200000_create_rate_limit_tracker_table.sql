-- Tabla para rastrear solicitudes para el rate limiting
CREATE TABLE public.rate_limit_tracker (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    identifier text NOT NULL UNIQUE,
    first_request_at timestamptz NOT NULL DEFAULT now(),
    request_count integer NOT NULL DEFAULT 1
);

-- Comentarios sobre la tabla
COMMENT ON TABLE public.rate_limit_tracker IS 'Rastrea las solicitudes por identificador (ej. IP) para implementar el rate limiting.';

-- Habilitar Row Level Security
ALTER TABLE public.rate_limit_tracker ENABLE ROW LEVEL SECURITY;

-- Política para denegar todo el acceso desde el frontend.
-- Solo el backend con la service_role_key debe poder acceder a esta tabla.
CREATE POLICY "Deny all access from frontend"
ON public.rate_limit_tracker
FOR ALL
USING (false)
WITH CHECK (false);
