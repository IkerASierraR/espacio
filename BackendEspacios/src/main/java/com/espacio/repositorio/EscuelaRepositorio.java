package com.espacio.repositorio;

import com.espacio.modelo.Escuela;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EscuelaRepositorio extends JpaRepository<Escuela, Integer> {
}
