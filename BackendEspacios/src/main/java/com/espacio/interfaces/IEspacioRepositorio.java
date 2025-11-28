/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.espacio.interfaces;

import com.espacio.modelo.Espacio;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IEspacioRepositorio extends JpaRepository<Espacio, Integer> {
    Optional<Espacio> findByCodigoIgnoreCase(String codigo);
}
