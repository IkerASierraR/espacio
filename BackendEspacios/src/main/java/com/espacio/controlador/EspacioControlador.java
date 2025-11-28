/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.espacio.controlador;

import com.espacio.dto.EspacioRequest;
import com.espacio.dto.EspacioResponse;
import com.espacio.interfaces.IEscuelaServicio;
import com.espacio.interfaces.IEspacioServicio;
import com.espacio.modelo.Escuela;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/espacios")
@Validated
public class EspacioControlador {

    private final IEspacioServicio espacioServicio;
    private final IEscuelaServicio escuelaServicio;

    public EspacioControlador(IEspacioServicio espacioServicio, IEscuelaServicio escuelaServicio) {
        this.espacioServicio = espacioServicio;
        this.escuelaServicio = escuelaServicio;
    }

    @GetMapping
    public List<EspacioResponse> listar() {
        return espacioServicio.listar();
    }

    @GetMapping("/{id}")
    public EspacioResponse buscarPorId(@PathVariable Integer id) {
        return espacioServicio.buscarPorId(id);
    }

    @GetMapping("/escuelas")
    public List<Escuela> listarEscuelas() {
        return escuelaServicio.listar();
    }

    @PostMapping
    public ResponseEntity<EspacioResponse> crear(@Valid @RequestBody EspacioRequest request) {
        EspacioResponse creado = espacioServicio.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public EspacioResponse actualizar(@PathVariable Integer id, @Valid @RequestBody EspacioRequest request) {
        return espacioServicio.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        espacioServicio.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
