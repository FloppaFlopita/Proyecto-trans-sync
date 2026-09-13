package com.transsync.ms_flota;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/buses")
public class BusController {

    @Autowired
    private BusRepository busRepository;

    @GetMapping
    public List<Bus> listarBuses() {
        return busRepository.findAll();
    }

    @PostMapping
    public Bus guardarBus(@RequestBody Bus bus) {
        return busRepository.save(bus);
    }
}
