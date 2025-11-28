/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.espacio.interfaces;

import com.espacio.dto.EspacioRequest;
import com.espacio.dto.EspacioResponse;
import java.util.List;

public interface IEspacioServicio {

    List<EspacioResponse> listar();

    EspacioResponse buscarPorId(Integer id);

    EspacioResponse crear(EspacioRequest request);

    EspacioResponse actualizar(Integer id, EspacioRequest request);

    void eliminar(Integer id);
}
