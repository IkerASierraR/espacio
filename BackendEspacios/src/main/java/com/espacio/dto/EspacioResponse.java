/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.espacio.dto;

public class EspacioResponse {

    private Integer id;
    private String codigo;
    private String nombre;
    private String tipo;
    private Integer capacidad;
    private String equipamiento;
    private Integer estado;
    private Integer escuelaId;
    private String escuelaNombre;

    public EspacioResponse() {
    }

    public EspacioResponse(Integer id, String codigo, String nombre, String tipo, Integer capacidad,
                           String equipamiento, Integer estado, Integer escuelaId, String escuelaNombre) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.tipo = tipo;
        this.capacidad = capacidad;
        this.equipamiento = equipamiento;
        this.estado = estado;
        this.escuelaId = escuelaId;
        this.escuelaNombre = escuelaNombre;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(Integer capacidad) {
        this.capacidad = capacidad;
    }

    public String getEquipamiento() {
        return equipamiento;
    }

    public void setEquipamiento(String equipamiento) {
        this.equipamiento = equipamiento;
    }

    public Integer getEstado() {
        return estado;
    }

    public void setEstado(Integer estado) {
        this.estado = estado;
    }

    public Integer getEscuelaId() {
        return escuelaId;
    }

    public void setEscuelaId(Integer escuelaId) {
        this.escuelaId = escuelaId;
    }

    public String getEscuelaNombre() {
        return escuelaNombre;
    }

    public void setEscuelaNombre(String escuelaNombre) {
        this.escuelaNombre = escuelaNombre;
    }
}
