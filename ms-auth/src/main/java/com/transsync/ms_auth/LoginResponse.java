package com.transsync.ms_auth;

import java.util.List;

public class LoginResponse {

    private String token;
    private String tipoToken = "Bearer";
    private Long usuarioId;
    private String email;
    private String nombre;
    private List<String> roles;
    private Long idCliente;
    private Long idConductor;

    public LoginResponse() {}

    public LoginResponse(String token, Long usuarioId, String email, String nombre, List<String> roles, Long idCliente, Long idConductor) {
        this.token = token;
        this.usuarioId = usuarioId;
        this.email = email;
        this.nombre = nombre;
        this.roles = roles;
        this.idCliente = idCliente;
        this.idConductor = idConductor;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTipoToken() { return tipoToken; }
    public void setTipoToken(String tipoToken) { this.tipoToken = tipoToken; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public Long getIdCliente() { return idCliente; }
    public void setIdCliente(Long idCliente) { this.idCliente = idCliente; }

    public Long getIdConductor() { return idConductor; }
    public void setIdConductor(Long idConductor) { this.idConductor = idConductor; }
}

