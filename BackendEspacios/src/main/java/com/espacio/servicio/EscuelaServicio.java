package com.espacio.servicio;

import com.espacio.interfaces.IEscuelaServicio;
import com.espacio.modelo.Escuela;
import com.espacio.repositorio.EscuelaRepositorio;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EscuelaServicio implements IEscuelaServicio {

    private final EscuelaRepositorio escuelaRepositorio;

    public EscuelaServicio(EscuelaRepositorio escuelaRepositorio) {
        this.escuelaRepositorio = escuelaRepositorio;
    }

    @Override
    public List<Escuela> listar() {
        return escuelaRepositorio.findAll();
    }
}
