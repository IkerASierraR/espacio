package com.espacio.controlador;

import com.espacio.interfaces.IEscuelaServicio;
import com.espacio.interfaces.IEspacioServicio;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class EspacioVistaControlador {

    private final IEspacioServicio espacioServicio;
    private final IEscuelaServicio escuelaServicio;

    public EspacioVistaControlador(IEspacioServicio espacioServicio, IEscuelaServicio escuelaServicio) {
        this.espacioServicio = espacioServicio;
        this.escuelaServicio = escuelaServicio;
    }

    @GetMapping({"/", "/espacios"})
    public String vistaEspacios(Model model) {
        model.addAttribute("espacios", espacioServicio.listar());
        model.addAttribute("escuelas", escuelaServicio.listar());
        return "espacios";
    }
}
