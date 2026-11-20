package com.transsync.ms_flota;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalFlotaExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", false);
        respuesta.put("timestamp", LocalDateTime.now());
        respuesta.put("mensaje", "Error de validación en los datos del autobús o mantenimiento");
        respuesta.put("errores", errores);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(respuesta);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", false);
        respuesta.put("timestamp", LocalDateTime.now());
        respuesta.put("mensaje", ex.getMessage());

        HttpStatus status = ex.getMessage() != null && ex.getMessage().toLowerCase().contains("no encontrado") 
                ? HttpStatus.NOT_FOUND 
                : HttpStatus.BAD_REQUEST;

        return ResponseEntity.status(status).body(respuesta);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("exito", false);
        respuesta.put("timestamp", LocalDateTime.now());
        respuesta.put("mensaje", ex.getMessage());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(respuesta);
    }
}
