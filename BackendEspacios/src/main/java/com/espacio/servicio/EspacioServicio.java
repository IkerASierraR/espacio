/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.espacio.servicio;

import com.espacio.dto.EspacioRequest;
import com.espacio.dto.EspacioResponse;
import com.espacio.interfaces.IEspacioServicio;
import com.espacio.modelo.Escuela;
import com.espacio.modelo.Espacio;
import com.espacio.repositorio.EscuelaRepositorio;
import com.espacio.repositorio.EspacioRepositorio;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class EspacioServicio implements IEspacioServicio {

    private final EspacioRepositorio espacioRepositorio;
    private final EscuelaRepositorio escuelaRepositorio;

    public EspacioServicio(EspacioRepositorio espacioRepositorio, EscuelaRepositorio escuelaRepositorio) {
        this.espacioRepositorio = espacioRepositorio;
        this.escuelaRepositorio = escuelaRepositorio;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponse> listar() {
        return listar(null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponse> listar(Integer estado, Integer escuelaId, String tipo) {
        validarFiltros(estado, escuelaId, tipo);

        return espacioRepositorio.findAll() 
                .stream()
                .filter(espacio -> estado == null || espacio.getEstado().equals(estado))
                .filter(espacio -> escuelaId == null || espacio.getEscuela().getId().equals(escuelaId))
                .filter(espacio -> {
                    if (tipo == null) {
                        return true;
                    }
                    return espacio.getTipo() != null && espacio.getTipo().equalsIgnoreCase(tipo);
                })
                .map(this::mapearRespuesta)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EspacioResponse buscarPorId(Integer id) {
        Espacio espacio = obtenerEspacio(id);
        return mapearRespuesta(espacio);
    }

    @Override
    public EspacioResponse crear(EspacioRequest request) {
        validarCodigoDisponible(request.getCodigo(), null);
        Escuela escuela = obtenerEscuela(request.getEscuelaId());
        Espacio espacio = new Espacio();
        aplicarDatos(espacio, request, escuela);
        return mapearRespuesta(espacioRepositorio.save(espacio));
    }

    @Override
    public EspacioResponse actualizar(Integer id, EspacioRequest request) {
        Espacio espacio = obtenerEspacio(id);
        validarCodigoDisponible(request.getCodigo(), id);
        Escuela escuela = obtenerEscuela(request.getEscuelaId());
        aplicarDatos(espacio, request, escuela);
        return mapearRespuesta(espacioRepositorio.save(espacio));
    }

    @Override
    public void eliminar(Integer id) {
        Espacio espacio = obtenerEspacio(id);
        espacio.setEstado(0);
        espacioRepositorio.save(espacio);
    }

    private void aplicarDatos(Espacio espacio, EspacioRequest request, Escuela escuela) {
        espacio.setCodigo(request.getCodigo().trim());
        espacio.setNombre(request.getNombre().trim());
        espacio.setTipo(request.getTipo().trim());
        espacio.setCapacidad(request.getCapacidad());
        String equipamiento = request.getEquipamiento();
        espacio.setEquipamiento(equipamiento == null ? null : equipamiento.trim());
        espacio.setEstado(request.getEstado() == null ? 1 : request.getEstado());
        espacio.setEscuela(escuela);
    }

    private EspacioResponse mapearRespuesta(Espacio espacio) {
        Escuela escuela = espacio.getEscuela();
        return new EspacioResponse(
                espacio.getId(),
                espacio.getCodigo(),
                espacio.getNombre(),
                espacio.getTipo(),
                espacio.getCapacidad(),
                espacio.getEquipamiento(),
                espacio.getEstado(),
                escuela != null ? escuela.getId() : null,
                escuela != null ? escuela.getNombre() : null,
                escuela != null ? escuela.getFacultadId() : null
        );
    }

    private Espacio obtenerEspacio(Integer id) {
        return espacioRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No se encontro el espacio con id " + id));
    }

    private Escuela obtenerEscuela(Integer id) {
        return escuelaRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No se encontro la escuela con id " + id));
    }

    private void validarCodigoDisponible(String codigo, Integer idActual) {
        if (codigo == null) {
            return;
        }
        var existente = espacioRepositorio.findByCodigoIgnoreCase(codigo.trim());
        if (existente.isPresent() && (idActual == null || !existente.get().getId().equals(idActual))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El codigo " + codigo + " ya esta registrado en otro espacio.");
        }
    }

    private void validarFiltros(Integer estado, Integer escuelaId, String tipo) {
        if (estado != null && estado != 0 && estado != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El estado debe ser 0 (inactivo) o 1 (activo)." );
        }

        if (escuelaId != null) {
            obtenerEscuela(escuelaId);
        }

        if (tipo != null && !tipo.isBlank()) {
            String tipoNormalizado = tipo.trim().toLowerCase(Locale.getDefault());
            if (!"laboratorio".equals(tipoNormalizado) && !"salon".equals(tipoNormalizado)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El tipo solo puede ser 'laboratorio' o 'salon'.");
            }
        }
    }
}
