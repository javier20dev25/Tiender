// src/features/auth/services/authContracts.ts

/**
 * Define la estructura de datos que el frontend debe enviar
 * para iniciar el proceso de registro orquestado.
 */
export interface OrchestrationSignUpRequest {
  email: string;
  password?: string; // Es opcional para permitir futuros proveedores como 'Sign in with Google'.
  whatsapp: string;
}

/**
 * Define los posibles códigos de error de negocio que el servicio de orquestación
 * puede devolver. Esto permite al frontend mostrar mensajes específicos al usuario.
 */
export type BusinessErrorCode =
  | 'WHATSAPP_IN_USE'
  | 'WHATSAPP_BLOCKED'
  | 'EMAIL_EXISTS'
  | 'INTERNAL_SERVER_ERROR';

/**
 * Define la estructura de una respuesta de error del servicio de orquestación.
 */
export interface OrchestrationErrorResponse {
  success: false;
  error_code: BusinessErrorCode;
  message: string;
}

/**
 * Define la estructura de una respuesta exitosa del servicio de orquestación.
 */
export interface OrchestrationSuccessResponse {
  success: true;
  message: string;
}

/**
 * Representa la respuesta completa del servicio de orquestación,
 * que puede ser de éxito o de error.
 */
export type OrchestrationSignUpResponse =
  | OrchestrationSuccessResponse
  | OrchestrationErrorResponse;
