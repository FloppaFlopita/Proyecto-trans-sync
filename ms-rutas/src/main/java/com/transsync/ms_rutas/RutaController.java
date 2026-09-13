package com.transsync.ms_rutas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/rutas")
public class RutaController {

    @Autowired
    private RutaRepository rutaRepository;

    @GetMapping
    public List<Ruta> listarRutas() {
        return rutaRepository.findAll();
    }

    @PostMapping
    public Ruta guardarRuta(@RequestBody Ruta ruta) {
        return rutaRepository.save(ruta);
    }
}
