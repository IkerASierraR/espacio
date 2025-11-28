-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para sisintupt
CREATE DATABASE IF NOT EXISTS `sisintupt` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `sisintupt`;

-- Volcando estructura para evento sisintupt.actualizar_sanciones_cumplidas
DELIMITER //
CREATE EVENT `actualizar_sanciones_cumplidas` ON SCHEDULE EVERY 1 DAY STARTS '2025-11-01 00:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
    -- Actualizar sanciones cuya fecha de fin ha pasado
    UPDATE sancion 
    SET Estado = 'Cumplida' 
    WHERE Estado = 'Activa' 
    AND FechaFin < CURDATE();
END//
DELIMITER ;

-- Volcando estructura para tabla sisintupt.administrativo
CREATE TABLE IF NOT EXISTS `administrativo` (
  `IdAdministrativo` int(11) NOT NULL AUTO_INCREMENT,
  `IdUsuario` int(11) NOT NULL,
  `Turno` enum('Mañana','Tarde','Noche','Completo') DEFAULT 'Completo',
  `Extension` varchar(10) DEFAULT NULL,
  `FechaIncorporacion` date NOT NULL,
  PRIMARY KEY (`IdAdministrativo`),
  UNIQUE KEY `IdUsuario` (`IdUsuario`),
  CONSTRAINT `FK_administrativo_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario` (`IdUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.administrativo: ~0 rows (aproximadamente)

-- Volcando estructura para evento sisintupt.aplicar_horarios_fijos
DELIMITER //
CREATE EVENT `aplicar_horarios_fijos` ON SCHEDULE EVERY 1 DAY STARTS '2025-11-01 00:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
    -- Bloquear horarios de cursos activos que están en fecha
    UPDATE horarios h
    JOIN horario_curso hc ON h.espacio = hc.Espacio
                           AND h.bloque = hc.Bloque
                           AND h.diaSemana = hc.DiaSemana
    SET h.ocupado = 1
    WHERE CURDATE() BETWEEN hc.FechaInicio AND hc.FechaFin
      AND hc.Estado = 1;
END//
DELIMITER ;

-- Volcando estructura para procedimiento sisintupt.aprobar_reserva
DELIMITER //
CREATE PROCEDURE `aprobar_reserva`(IN p_IdReserva INT)
BEGIN
    DECLARE v_usuario INT;
    DECLARE v_espacio INT;
    DECLARE v_bloque INT;
    DECLARE v_fecha DATE;
    DECLARE v_rol INT;
    DECLARE v_motivo_rechazo VARCHAR(255);
    DECLARE v_existen_otros_estudiantes INT DEFAULT 0;

    -- Obtener datos de la reserva
    SELECT r.usuario, r.espacio, r.bloque, r.fechaReserva, u.Rol 
    INTO v_usuario, v_espacio, v_bloque, v_fecha, v_rol
    FROM reserva r
    JOIN usuario u ON r.usuario = u.IdUsuario
    WHERE r.IdReserva = p_IdReserva;

    -- Insertar en reserva_gestion para aprobar
    INSERT INTO reserva_gestion (IdReserva, UsuarioGestion, Accion, Motivo)
    VALUES (p_IdReserva, v_usuario, 'Aprobar', 'Reserva aprobada mediante procedimiento');

    -- CASO 1: Si es PROFESOR (Rol 1) - PRIORIDAD MÁXIMA
    IF v_rol = 1 THEN
        SET v_motivo_rechazo = 'un docente reservo prioritario';
        
        -- Rechazar TODAS las otras reservas pendientes (estudiantes, admins, otros docentes)
        INSERT INTO reserva_gestion (IdReserva, UsuarioGestion, Accion, Motivo)
        SELECT r.IdReserva, v_usuario, 'Rechazar', v_motivo_rechazo
        FROM reserva r
        WHERE r.espacio = v_espacio
          AND r.fechaReserva = v_fecha
          AND r.bloque = v_bloque
          AND r.Estado = 'Pendiente'
          AND r.IdReserva != p_IdReserva;

    -- CASO 2: Si es ADMINISTRADOR (Rol 3) - PRIORIDAD ALTA
    ELSEIF v_rol = 3 THEN
        SET v_motivo_rechazo = 'prioridad auditoria';
        
        -- Rechazar TODAS las otras reservas pendientes
        INSERT INTO reserva_gestion (IdReserva, UsuarioGestion, Accion, Motivo)
        SELECT r.IdReserva, v_usuario, 'Rechazar', v_motivo_rechazo
        FROM reserva r
        WHERE r.espacio = v_espacio
          AND r.fechaReserva = v_fecha
          AND r.bloque = v_bloque
          AND r.Estado = 'Pendiente'
          AND r.IdReserva != p_IdReserva;

    -- CASO 3: Si es ESTUDIANTE (Rol 2) - PRIORIDAD BAJA (solo sobre otros estudiantes)
    ELSEIF v_rol = 2 THEN
        -- Verificar si hay otros estudiantes pendientes
        SELECT COUNT(*) INTO v_existen_otros_estudiantes
        FROM reserva r
        JOIN usuario u ON r.usuario = u.IdUsuario
        WHERE r.espacio = v_espacio
          AND r.fechaReserva = v_fecha
          AND r.bloque = v_bloque
          AND r.Estado = 'Pendiente'
          AND u.Rol = 2  -- Solo estudiantes
          AND r.IdReserva != p_IdReserva;

        -- Si hay otros estudiantes pendientes, rechazarlos
        IF v_existen_otros_estudiantes > 0 THEN
            SET v_motivo_rechazo = 'estudiante reservo primero';
            
            -- Rechazar SOLO otros estudiantes (no afecta docentes ni administradores)
            INSERT INTO reserva_gestion (IdReserva, UsuarioGestion, Accion, Motivo)
            SELECT r.IdReserva, v_usuario, 'Rechazar', v_motivo_rechazo
            FROM reserva r
            JOIN usuario u ON r.usuario = u.IdUsuario
            WHERE r.espacio = v_espacio
              AND r.fechaReserva = v_fecha
              AND r.bloque = v_bloque
              AND r.Estado = 'Pendiente'
              AND u.Rol = 2  -- Solo estudiantes
              AND r.IdReserva != p_IdReserva;
        END IF;
    END IF;
END//
DELIMITER ;

-- Volcando estructura para tabla sisintupt.auditoriareserva
CREATE TABLE IF NOT EXISTS `auditoriareserva` (
  `IdAudit` int(11) NOT NULL AUTO_INCREMENT,
  `IdReserva` int(11) NOT NULL,
  `EstadoAnterior` varchar(50) NOT NULL,
  `EstadoNuevo` varchar(50) NOT NULL,
  `FechaCambio` datetime NOT NULL DEFAULT current_timestamp(),
  `UsuarioCambio` int(11) DEFAULT NULL,
  PRIMARY KEY (`IdAudit`),
  KEY `FK_auditoriareserva_reserva` (`IdReserva`),
  KEY `FK_auditoriareserva_usuario` (`UsuarioCambio`),
  CONSTRAINT `FK_auditoriareserva_reserva` FOREIGN KEY (`IdReserva`) REFERENCES `reserva` (`IdReserva`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_auditoriareserva_usuario` FOREIGN KEY (`UsuarioCambio`) REFERENCES `usuario` (`IdUsuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.auditoriareserva: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.bloqueshorarios
CREATE TABLE IF NOT EXISTS `bloqueshorarios` (
  `IdBloque` int(11) NOT NULL AUTO_INCREMENT,
  `Orden` int(11) NOT NULL,
  `Nombre` varchar(50) NOT NULL,
  `HoraInicio` time NOT NULL,
  `HoraFinal` time NOT NULL,
  PRIMARY KEY (`IdBloque`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.bloqueshorarios: ~0 rows (aproximadamente)

-- Volcando estructura para procedimiento sisintupt.crear_reserva_automatica
DELIMITER //
CREATE PROCEDURE `crear_reserva_automatica`(
    IN p_usuario INT,
    IN p_espacio INT,
    IN p_bloque INT,
    IN p_curso INT,
    IN p_fechaReserva DATE,
    IN p_descripcion TEXT,
    IN p_cantidadEstudiantes INT
)
BEGIN
    DECLARE v_dia_semana VARCHAR(10);
    DECLARE v_horario_ocupado INT DEFAULT 0;
    DECLARE v_reserva_existente INT DEFAULT 0;
    
    -- Determinar el día de la semana
    SET v_dia_semana = CASE DAYOFWEEK(p_fechaReserva)
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miercoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sabado'
        ELSE 'Lunes'
    END;
    
    -- Verificar si el horario está ocupado por horarios fijos
    SELECT COUNT(*) INTO v_horario_ocupado
    FROM horarios 
    WHERE espacio = p_espacio 
    AND bloque = p_bloque 
    AND diaSemana = v_dia_semana 
    AND ocupado = 1;
    
    -- Verificar si ya existe una reserva aprobada para ese horario
    SELECT COUNT(*) INTO v_reserva_existente
    FROM reserva 
    WHERE espacio = p_espacio 
    AND bloque = p_bloque 
    AND fechaReserva = p_fechaReserva 
    AND Estado = 'Aprobada';
    
    -- Si el horario está libre, crear la reserva
    IF v_horario_ocupado = 0 AND v_reserva_existente = 0 THEN
        INSERT INTO reserva (usuario, espacio, bloque, curso, fechaReserva, DescripcionUso, CantidadEstudiantes, Estado)
        VALUES (p_usuario, p_espacio, p_bloque, p_curso, p_fechaReserva, p_descripcion, p_cantidadEstudiantes, 'Pendiente');
        
        SELECT LAST_INSERT_ID() AS IdReserva, 'Reserva creada exitosamente' AS Mensaje;
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El horario seleccionado no está disponible';
    END IF;
END//
DELIMITER ;

-- Volcando estructura para tabla sisintupt.cursos
CREATE TABLE IF NOT EXISTS `cursos` (
  `IdCurso` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) NOT NULL,
  `Facultad` int(11) NOT NULL,
  `Escuela` int(11) NOT NULL,
  `Ciclo` varchar(5) NOT NULL,
  `Estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IdCurso`),
  KEY `FK_cursos_facultad` (`Facultad`),
  KEY `FK_cursos_escuela` (`Escuela`),
  CONSTRAINT `FK_cursos_escuela` FOREIGN KEY (`Escuela`) REFERENCES `escuela` (`IdEscuela`),
  CONSTRAINT `FK_cursos_facultad` FOREIGN KEY (`Facultad`) REFERENCES `facultad` (`IdFacultad`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.cursos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.docente
CREATE TABLE IF NOT EXISTS `docente` (
  `IdDocente` int(11) NOT NULL AUTO_INCREMENT,
  `IdUsuario` int(11) NOT NULL,
  `CodigoDocente` varchar(20) NOT NULL,
  `Escuela` int(11) DEFAULT NULL,
  `TipoContrato` enum('Tiempo Completo','Medio Tiempo','Contratado') NOT NULL,
  `Especialidad` varchar(100) DEFAULT NULL,
  `FechaIncorporacion` date NOT NULL,
  PRIMARY KEY (`IdDocente`),
  UNIQUE KEY `IdUsuario` (`IdUsuario`),
  UNIQUE KEY `CodigoDocente` (`CodigoDocente`),
  KEY `FK_docente_escuela` (`Escuela`),
  CONSTRAINT `FK_docente_escuela` FOREIGN KEY (`Escuela`) REFERENCES `escuela` (`IdEscuela`),
  CONSTRAINT `FK_docente_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario` (`IdUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.docente: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.escuela
CREATE TABLE IF NOT EXISTS `escuela` (
  `IdEscuela` int(11) NOT NULL AUTO_INCREMENT,
  `IdFacultad` int(11) NOT NULL,
  `Nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`IdEscuela`),
  KEY `FK__facultad` (`IdFacultad`),
  CONSTRAINT `FK__facultad` FOREIGN KEY (`IdFacultad`) REFERENCES `facultad` (`IdFacultad`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.escuela: ~19 rows (aproximadamente)
INSERT INTO `escuela` (`IdEscuela`, `IdFacultad`, `Nombre`) VALUES
	(1, 1, 'Ing. Civil'),
	(2, 1, 'Ing. de Sistemas'),
	(3, 1, 'Ing. Electronica'),
	(4, 1, 'Ing. Agroindustrial'),
	(5, 1, 'Ing. Ambiental'),
	(6, 1, 'Ing. Industrial'),
	(7, 2, 'Derecho'),
	(8, 3, 'Ciencias Contables y Financieras'),
	(9, 3, 'Economia y Microfinanzas'),
	(10, 3, 'Administracion'),
	(11, 3, 'Administracion Turistico-Hotel'),
	(12, 3, 'Administracion de Negocios Internacionales'),
	(13, 4, 'Educacion'),
	(14, 4, 'Ciencias de la Comunicacion'),
	(15, 4, 'Humanidades - Psicologia'),
	(16, 5, 'Medicina Humana'),
	(17, 5, 'Odontologia'),
	(18, 5, 'Tecnologia Medica'),
	(19, 6, 'Arquitectira');

-- Volcando estructura para tabla sisintupt.espacio
CREATE TABLE IF NOT EXISTS `espacio` (
  `IdEspacio` int(11) NOT NULL AUTO_INCREMENT,
  `Codigo` varchar(20) NOT NULL DEFAULT '',
  `Nombre` varchar(100) NOT NULL,
  `Tipo` enum('Laboratorio','Salon') NOT NULL DEFAULT 'Laboratorio',
  `Capacidad` int(11) NOT NULL,
  `Equipamiento` text DEFAULT NULL,
  `Escuela` int(11) NOT NULL,
  `Estado` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IdEspacio`),
  UNIQUE KEY `Codigo` (`Codigo`),
  KEY `FK_espacio_escuela` (`Escuela`),
  CONSTRAINT `FK_espacio_escuela` FOREIGN KEY (`Escuela`) REFERENCES `escuela` (`IdEscuela`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.espacio: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.estudiante
CREATE TABLE IF NOT EXISTS `estudiante` (
  `IdEstudiante` int(11) NOT NULL AUTO_INCREMENT,
  `IdUsuario` int(11) NOT NULL,
  `Codigo` varchar(20) NOT NULL,
  `Escuela` int(11) NOT NULL,
  PRIMARY KEY (`IdEstudiante`),
  UNIQUE KEY `IdUsuario` (`IdUsuario`),
  UNIQUE KEY `Codigo` (`Codigo`),
  KEY `FK_estudiante_escuela` (`Escuela`),
  CONSTRAINT `FK_estudiante_escuela` FOREIGN KEY (`Escuela`) REFERENCES `escuela` (`IdEscuela`),
  CONSTRAINT `FK_estudiante_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario` (`IdUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.estudiante: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.facultad
CREATE TABLE IF NOT EXISTS `facultad` (
  `IdFacultad` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) NOT NULL,
  `Abreviatura` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`IdFacultad`),
  UNIQUE KEY `Nombre` (`Nombre`),
  UNIQUE KEY `Abreviatura` (`Abreviatura`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.facultad: ~6 rows (aproximadamente)
INSERT INTO `facultad` (`IdFacultad`, `Nombre`, `Abreviatura`) VALUES
	(1, 'Facultad de Ingeniería', 'FAING'),
	(2, 'Facultad de Derecho y Ciencias Políticas', 'FADE'),
	(3, 'Facultad de Ciencias Empresariales', 'FACEM'),
	(4, 'Facultad de Educación, Ciencias de la Comunicación', 'FAEDCOH'),
	(5, 'Facultad de Ciencias De la Salud', 'FACSA'),
	(6, 'Facultad de Arquitectura y Urbanismo', 'FAU');

-- Volcando estructura para tabla sisintupt.horarios
CREATE TABLE IF NOT EXISTS `horarios` (
  `IdHorario` int(11) NOT NULL AUTO_INCREMENT,
  `espacio` int(11) NOT NULL,
  `bloque` int(11) NOT NULL,
  `diaSemana` enum('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado') NOT NULL,
  `ocupado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`IdHorario`) USING BTREE,
  KEY `FK_horario_espacio` (`espacio`) USING BTREE,
  KEY `FK_horario_bloque` (`bloque`) USING BTREE,
  CONSTRAINT `FK_horario_bloque` FOREIGN KEY (`bloque`) REFERENCES `bloqueshorarios` (`IdBloque`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_horario_espacio` FOREIGN KEY (`espacio`) REFERENCES `espacio` (`IdEspacio`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=465 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.horarios: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.horario_curso
CREATE TABLE IF NOT EXISTS `horario_curso` (
  `IdHorarioCurso` int(11) NOT NULL AUTO_INCREMENT,
  `Curso` int(11) NOT NULL,
  `Docente` int(11) NOT NULL,
  `Espacio` int(11) NOT NULL,
  `Bloque` int(11) NOT NULL,
  `DiaSemana` enum('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado') NOT NULL,
  `FechaInicio` date NOT NULL,
  `FechaFin` date NOT NULL,
  `Estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IdHorarioCurso`),
  KEY `FK_horario_curso_usuario` (`Docente`),
  KEY `FK_horario_curso_espacio` (`Espacio`),
  KEY `FK_horario_curso_bloqueshorarios` (`Bloque`),
  KEY `FK_horario_curso_cursos` (`Curso`),
  CONSTRAINT `FK_horario_curso_bloqueshorarios` FOREIGN KEY (`Bloque`) REFERENCES `bloqueshorarios` (`IdBloque`),
  CONSTRAINT `FK_horario_curso_cursos` FOREIGN KEY (`Curso`) REFERENCES `cursos` (`IdCurso`),
  CONSTRAINT `FK_horario_curso_espacio` FOREIGN KEY (`Espacio`) REFERENCES `espacio` (`IdEspacio`),
  CONSTRAINT `FK_horario_curso_usuario` FOREIGN KEY (`Docente`) REFERENCES `usuario` (`IdUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.horario_curso: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.incidencia
CREATE TABLE IF NOT EXISTS `incidencia` (
  `IdIncidencia` int(11) NOT NULL AUTO_INCREMENT,
  `Reserva` int(11) NOT NULL,
  `Descripcion` text NOT NULL,
  `FechaReporte` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`IdIncidencia`),
  KEY `FK_incidencia_reserva` (`Reserva`),
  CONSTRAINT `FK_incidencia_reserva` FOREIGN KEY (`Reserva`) REFERENCES `reserva` (`IdReserva`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.incidencia: ~0 rows (aproximadamente)

-- Volcando estructura para evento sisintupt.liberar_horarios_fijos
DELIMITER //
CREATE EVENT `liberar_horarios_fijos` ON SCHEDULE EVERY 1 DAY STARTS '2025-11-01 00:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
    -- Actualizar estado de cursos expirados
    UPDATE horario_curso
    SET Estado = 0
    WHERE FechaFin < CURDATE();
    
    -- Liberar horarios de cursos expirados
    UPDATE horarios h
    JOIN horario_curso hc ON h.espacio = hc.Espacio
                           AND h.bloque = hc.Bloque
                           AND h.diaSemana = hc.DiaSemana
    SET h.ocupado = 0
    WHERE hc.FechaFin < CURDATE()
      AND h.ocupado = 1;
END//
DELIMITER ;

-- Volcando estructura para tabla sisintupt.reserva
CREATE TABLE IF NOT EXISTS `reserva` (
  `IdReserva` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` int(11) NOT NULL,
  `espacio` int(11) NOT NULL,
  `bloque` int(11) NOT NULL,
  `curso` int(11) NOT NULL,
  `fechaReserva` date NOT NULL,
  `fechaSolicitud` datetime NOT NULL DEFAULT current_timestamp(),
  `DescripcionUso` text DEFAULT NULL,
  `CantidadEstudiantes` int(11) NOT NULL DEFAULT 1,
  `Estado` enum('Pendiente','Aprobada','Rechazada','Cancelada') NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`IdReserva`),
  KEY `FK_reserva_espacio` (`espacio`),
  KEY `FK_reserva_usuario` (`usuario`),
  KEY `FK_reserva_bloqueshorarios` (`bloque`),
  KEY `FK_reserva_curso` (`curso`) USING BTREE,
  CONSTRAINT `FK_reserva_bloqueshorarios` FOREIGN KEY (`bloque`) REFERENCES `bloqueshorarios` (`IdBloque`),
  CONSTRAINT `FK_reserva_curso` FOREIGN KEY (`curso`) REFERENCES `cursos` (`IdCurso`),
  CONSTRAINT `FK_reserva_espacio` FOREIGN KEY (`espacio`) REFERENCES `espacio` (`IdEspacio`),
  CONSTRAINT `FK_reserva_usuario` FOREIGN KEY (`usuario`) REFERENCES `usuario` (`IdUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.reserva: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.reserva_gestion
CREATE TABLE IF NOT EXISTS `reserva_gestion` (
  `IdGestion` int(11) NOT NULL AUTO_INCREMENT,
  `IdReserva` int(11) NOT NULL,
  `UsuarioGestion` int(11) NOT NULL COMMENT 'Admin que gestiona',
  `FechaGestion` datetime NOT NULL DEFAULT current_timestamp(),
  `Accion` enum('Aprobar','Rechazar') NOT NULL,
  `Motivo` text NOT NULL COMMENT 'Motivo de la acción',
  `Comentarios` text DEFAULT NULL COMMENT 'Comentarios adicionales',
  PRIMARY KEY (`IdGestion`),
  KEY `FK_gestion_reserva` (`IdReserva`),
  KEY `FK_gestion_usuario` (`UsuarioGestion`),
  CONSTRAINT `FK_gestion_reserva` FOREIGN KEY (`IdReserva`) REFERENCES `reserva` (`IdReserva`) ON DELETE CASCADE,
  CONSTRAINT `FK_gestion_usuario` FOREIGN KEY (`UsuarioGestion`) REFERENCES `usuario` (`IdUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.reserva_gestion: ~0 rows (aproximadamente)

-- Volcando estructura para evento sisintupt.resetear_bloqueos
DELIMITER //
CREATE EVENT `resetear_bloqueos` ON SCHEDULE EVERY 1 HOUR STARTS '2025-11-01 00:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
    -- Desbloquear cuentas después de 24 horas
    UPDATE usuario_auth 
    SET IntentosFallidos = 0, 
        BloqueadoHasta = NULL 
    WHERE BloqueadoHasta IS NOT NULL 
    AND BloqueadoHasta < NOW();
    
    -- Limpiar tokens de recuperación expirados
    UPDATE usuario_auth 
    SET TokenRecuperacion = NULL, 
        TokenExpiracion = NULL 
    WHERE TokenExpiracion IS NOT NULL 
    AND TokenExpiracion < NOW();
END//
DELIMITER ;

-- Volcando estructura para evento sisintupt.reset_horarios_domingo
DELIMITER //
CREATE EVENT `reset_horarios_domingo` ON SCHEDULE EVERY 1 WEEK STARTS '2025-11-02 00:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
    -- Liberar horarios de reservas pasadas
    UPDATE horarios h
    JOIN reserva r ON h.espacio = r.espacio AND h.bloque = r.bloque
    SET h.ocupado = 0
    WHERE r.fechaReserva < CURDATE();
END//
DELIMITER ;

-- Volcando estructura para tabla sisintupt.rol
CREATE TABLE IF NOT EXISTS `rol` (
  `IdRol` int(11) NOT NULL,
  `Nombre` varchar(15) NOT NULL,
  PRIMARY KEY (`IdRol`),
  UNIQUE KEY `Nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.rol: ~4 rows (aproximadamente)
INSERT INTO `rol` (`IdRol`, `Nombre`) VALUES
	(1, 'Profesor'),
	(2, 'Estudiante'),
	(3, 'Administrador'),
	(4, 'Supervisor');

-- Volcando estructura para tabla sisintupt.sancion
CREATE TABLE IF NOT EXISTS `sancion` (
  `IdSancion` int(11) NOT NULL AUTO_INCREMENT,
  `Usuario` int(11) NOT NULL,
  `Motivo` text NOT NULL,
  `FechaInicio` date NOT NULL,
  `FechaFin` date NOT NULL,
  `Estado` enum('Activa','Cumplida') DEFAULT 'Activa',
  PRIMARY KEY (`IdSancion`),
  KEY `Usuario` (`Usuario`),
  CONSTRAINT `sancion_ibfk_1` FOREIGN KEY (`Usuario`) REFERENCES `usuario` (`IdUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.sancion: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.tipodocumento
CREATE TABLE IF NOT EXISTS `tipodocumento` (
  `IdTipoDoc` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) NOT NULL,
  `Abreviatura` varchar(10) NOT NULL,
  PRIMARY KEY (`IdTipoDoc`),
  UNIQUE KEY `Nombre` (`Nombre`),
  UNIQUE KEY `Abreviatura` (`Abreviatura`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.tipodocumento: ~12 rows (aproximadamente)
INSERT INTO `tipodocumento` (`IdTipoDoc`, `Nombre`, `Abreviatura`) VALUES
	(1, 'Documento Nacional de Identidad', 'DNI'),
	(2, 'Carnet de Extranjería', 'CE'),
	(3, 'Pasaporte', 'PAS'),
	(4, 'Permiso Temporal de Permanencia', 'PTP'),
	(5, 'Cédula de Identidad', 'CI'),
	(6, 'Registro Único de Contribuyente', 'RUC'),
	(7, 'Partida de Nacimiento', 'PN'),
	(8, 'Carnet de Refugiado', 'CR'),
	(9, 'Documento de Identidad Extranjero', 'DIE'),
	(10, 'Licencia de Conducir', 'LIC'),
	(11, 'Carnet Universitario', 'CU'),
	(12, 'Otro', 'OTRO');

-- Volcando estructura para tabla sisintupt.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `IdUsuario` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(30) NOT NULL,
  `Apellido` varchar(30) NOT NULL,
  `TipoDoc` int(11) NOT NULL,
  `NumDoc` varchar(20) NOT NULL DEFAULT '',
  `Rol` int(11) NOT NULL,
  `Celular` varchar(11) DEFAULT NULL,
  `Genero` bit(1) DEFAULT NULL,
  `Estado` int(11) NOT NULL DEFAULT 1,
  `FechaRegistro` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`IdUsuario`),
  UNIQUE KEY `NumDoc` (`NumDoc`),
  KEY `FK_usuario_rol` (`Rol`),
  KEY `FK_usuario_tipodocumento` (`TipoDoc`),
  CONSTRAINT `FK_usuario_rol` FOREIGN KEY (`Rol`) REFERENCES `rol` (`IdRol`),
  CONSTRAINT `FK_usuario_tipodocumento` FOREIGN KEY (`TipoDoc`) REFERENCES `tipodocumento` (`IdTipoDoc`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.usuario: ~5 rows (aproximadamente)
INSERT INTO `usuario` (`IdUsuario`, `Nombre`, `Apellido`, `TipoDoc`, `NumDoc`, `Rol`, `Celular`, `Genero`, `Estado`, `FechaRegistro`) VALUES
	(5, 'STEVIE', 'MARCA', 1, '72405382', 1, '979793902', b'1', 1, '2025-11-01 00:00:00'),
	(7, 'DAYAN', 'JAHUIRA', 1, '12345678', 1, '123456789', b'1', 1, '2025-11-01 00:00:00'),
	(10, 'STEVIE', 'AGUILAR', 1, '12345679', 3, '987654321', b'1', 1, '2025-11-01 00:00:00'),
	(11, 'CRISTIAN', 'MAMANI', 1, '72405638', 3, '979739029', b'1', 1, '2025-11-01 00:00:00'),
	(13, 'Ejemplo', 'Ejemplo', 3, 'A12345678', 2, '987654321', b'1', 1, '2025-11-01 00:00:00');

-- Volcando estructura para tabla sisintupt.usuario_auth
CREATE TABLE IF NOT EXISTS `usuario_auth` (
  `IdAuth` int(11) NOT NULL AUTO_INCREMENT,
  `IdUsuario` int(11) NOT NULL,
  `CorreoU` varchar(30) NOT NULL,
  `Password` varchar(255) NOT NULL DEFAULT '',
  `UltimoLogin` datetime DEFAULT NULL,
  `TokenRecuperacion` varchar(255) DEFAULT NULL,
  `TokenExpiracion` datetime DEFAULT NULL,
  PRIMARY KEY (`IdAuth`),
  UNIQUE KEY `IdUsuario` (`IdUsuario`),
  UNIQUE KEY `CorreoU` (`CorreoU`),
  CONSTRAINT `FK_usuario_auth_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario` (`IdUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.usuario_auth: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sisintupt.usuario_sesion
CREATE TABLE IF NOT EXISTS `usuario_sesion` (
  `IdSesion` int(11) NOT NULL AUTO_INCREMENT,
  `IdUsuario` int(11) NOT NULL,
  `Dispositivo` varchar(50) DEFAULT NULL,
  `IP` varchar(45) DEFAULT NULL,
  `Activa` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IdSesion`),
  KEY `FK_usuario_sesion_usuario` (`IdUsuario`),
  CONSTRAINT `FK_usuario_sesion_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario` (`IdUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla sisintupt.usuario_sesion: ~0 rows (aproximadamente)

-- Volcando estructura para disparador sisintupt.trg_actualizar_estado_sancion
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_actualizar_estado_sancion` BEFORE UPDATE ON `sancion` FOR EACH ROW BEGIN
    -- Si la fecha actual es mayor que FechaFin, marcar como cumplida automáticamente
    IF CURDATE() > NEW.FechaFin AND NEW.Estado = 'Activa' THEN
        SET NEW.Estado = 'Cumplida';
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_actualizar_horario_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_actualizar_horario_update` AFTER UPDATE ON `reserva` FOR EACH ROW BEGIN
    DECLARE dia ENUM('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado');

    SET dia = CASE DAYOFWEEK(NEW.fechaReserva)
        WHEN 2 THEN 'Lunes'
        WHEN 3 THEN 'Martes'
        WHEN 4 THEN 'Miercoles'
        WHEN 5 THEN 'Jueves'
        WHEN 6 THEN 'Viernes'
        WHEN 7 THEN 'Sabado'
        ELSE 'Lunes' -- Default si cae domingo
    END;

    IF NEW.Estado = 'Aprobada' THEN
        UPDATE horarios h
        SET h.ocupado = 1
        WHERE h.espacio = NEW.espacio
          AND h.bloque = NEW.bloque
          AND h.diaSemana = dia;
    ELSEIF NEW.Estado IN ('Rechazada','Cancelada') AND OLD.Estado = 'Aprobada' THEN
        UPDATE horarios h
        SET h.ocupado = 0
        WHERE h.espacio = NEW.espacio
          AND h.bloque = NEW.bloque
          AND h.diaSemana = dia;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_auditoria_reserva
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_auditoria_reserva` AFTER UPDATE ON `reserva` FOR EACH ROW BEGIN
    DECLARE usuario_gestion INT;
    
    -- Solo registrar si el estado cambió
    IF OLD.Estado <> NEW.Estado THEN
        -- Obtener el ÚLTIMO usuario que gestionó esta reserva
        SELECT rg.UsuarioGestion INTO usuario_gestion
        FROM reserva_gestion rg
        WHERE rg.IdReserva = NEW.IdReserva
        ORDER BY rg.FechaGestion DESC
        LIMIT 1;
        
        -- Si no hay gestión, usar el usuario de la reserva
        SET usuario_gestion = COALESCE(usuario_gestion, NEW.usuario);
        
        INSERT INTO auditoriareserva (IdReserva, EstadoAnterior, EstadoNuevo, UsuarioCambio)
        VALUES (NEW.IdReserva, OLD.Estado, NEW.Estado, usuario_gestion);
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_bloquear_horario_curso_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_bloquear_horario_curso_insert` AFTER INSERT ON `horario_curso` FOR EACH ROW BEGIN
    -- Si la fecha actual está dentro del rango del curso, bloquear inmediatamente
    IF CURDATE() BETWEEN NEW.FechaInicio AND NEW.FechaFin AND NEW.Estado = 1 THEN
        UPDATE horarios 
        SET ocupado = 1 
        WHERE espacio = NEW.Espacio 
          AND bloque = NEW.Bloque 
          AND diaSemana = NEW.DiaSemana;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_bloquear_horario_curso_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_bloquear_horario_curso_update` AFTER UPDATE ON `horario_curso` FOR EACH ROW BEGIN
    -- Liberar el horario anterior si cambió espacio, bloque, día o si el curso expiró/desactivó
    IF (OLD.Estado = 1 AND NEW.Estado = 0) OR 
       (OLD.Estado = 1 AND (NEW.Espacio != OLD.Espacio OR NEW.Bloque != OLD.Bloque OR NEW.DiaSemana != OLD.DiaSemana)) OR
       (OLD.Estado = 1 AND CURDATE() NOT BETWEEN NEW.FechaInicio AND NEW.FechaFin) THEN
        
        UPDATE horarios 
        SET ocupado = 0 
        WHERE espacio = OLD.Espacio 
          AND bloque = OLD.Bloque 
          AND diaSemana = OLD.DiaSemana;
    END IF;
    
    -- Bloquear el nuevo horario si está activo y en fecha válida
    IF NEW.Estado = 1 AND CURDATE() BETWEEN NEW.FechaInicio AND NEW.FechaFin THEN
        UPDATE horarios 
        SET ocupado = 1 
        WHERE espacio = NEW.Espacio 
          AND bloque = NEW.Bloque 
          AND diaSemana = NEW.DiaSemana;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_crear_horarios
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_crear_horarios` AFTER INSERT ON `bloqueshorarios` FOR EACH ROW BEGIN
    -- Insertar horarios automáticamente para cada espacio y cada día de la semana
    INSERT INTO horarios (espacio, bloque, diaSemana, ocupado)
    SELECT e.IdEspacio, NEW.IdBloque, d.dia, 0
    FROM espacio e
    CROSS JOIN (
        SELECT 'Lunes' AS dia
        UNION ALL SELECT 'Martes'
        UNION ALL SELECT 'Miercoles'
        UNION ALL SELECT 'Jueves'
        UNION ALL SELECT 'Viernes'
        UNION ALL SELECT 'Sabado'
    ) d;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_crear_horarios_espacios
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_crear_horarios_espacios` AFTER INSERT ON `espacio` FOR EACH ROW BEGIN
	INSERT INTO horarios (espacio, bloque, diaSemana, ocupado)
    SELECT NEW.IdEspacio, b.IdBloque, d.dia, 0
    FROM bloqueshorarios b
    CROSS JOIN (
        SELECT 'Lunes' AS dia UNION SELECT 'Martes' UNION SELECT 'Miercoles'
        UNION SELECT 'Jueves' UNION SELECT 'Viernes' UNION SELECT 'Sabado'
    ) d;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_eliminar_horarios_bloque
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_eliminar_horarios_bloque` AFTER DELETE ON `bloqueshorarios` FOR EACH ROW BEGIN
	DELETE FROM horarios 
    WHERE bloque = OLD.IdBloque;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_eliminar_horarios_espacio
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_eliminar_horarios_espacio` AFTER DELETE ON `espacio` FOR EACH ROW BEGIN
	DELETE FROM horarios 
    WHERE espacio = OLD.IdEspacio;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_liberar_horario_curso_delete
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_liberar_horario_curso_delete` AFTER DELETE ON `horario_curso` FOR EACH ROW BEGIN
    UPDATE horarios 
    SET ocupado = 0 
    WHERE espacio = OLD.Espacio 
      AND bloque = OLD.Bloque 
      AND diaSemana = OLD.DiaSemana;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_sincronizar_estado_gestion
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_sincronizar_estado_gestion` AFTER INSERT ON `reserva_gestion` FOR EACH ROW BEGIN
    DECLARE nuevo_estado VARCHAR(20);
    
    -- Convertir Accion a Estado
    CASE NEW.Accion
        WHEN 'Aprobar' THEN SET nuevo_estado = 'Aprobada';
        WHEN 'Rechazar' THEN SET nuevo_estado = 'Rechazada';
        ELSE SET nuevo_estado = 'Pendiente';
    END CASE;
    
    -- Actualizar estado en reserva (esto disparará el trigger de horarios)
    UPDATE reserva 
    SET Estado = nuevo_estado 
    WHERE IdReserva = NEW.IdReserva;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Volcando estructura para disparador sisintupt.trg_verificar_sanciones_activas
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_verificar_sanciones_activas` BEFORE INSERT ON `reserva` FOR EACH ROW BEGIN
    DECLARE sancion_activa INT DEFAULT 0;
    
    -- Verificar si el usuario tiene una sanción activa
    SELECT COUNT(*) INTO sancion_activa
    FROM sancion 
    WHERE Usuario = NEW.usuario 
    AND Estado = 'Activa'
    AND CURDATE() BETWEEN FechaInicio AND FechaFin;
    
    -- Si tiene sanción activa, impedir la reserva
    IF sancion_activa > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El usuario tiene una sanción activa y no puede realizar reservas';
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
