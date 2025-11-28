import React, { useState } from 'react';
import { ExternalLink, LayoutGrid, X } from 'lucide-react';

interface Categoria {
  id: string;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
  enlaces: Enlace[];
}

interface Enlace {
  url: string;
  titulo: string;
  descripcion?: string;
}

const categorias: Categoria[] = [
    {
        id: 'academica',
        titulo: 'Plataformas Académicas',
        descripcion: 'Sistemas de gestión educativa',
        icono: <LayoutGrid size={20} />,
        color: 'blue',
        enlaces: [
        {
            url: 'https://www.upt.edu.pe/upt/web/index.php',
            titulo: 'Página Principal UPT',
            descripcion: 'Sistema académico principal'
        },
        {
            url: 'https://net.upt.edu.pe/index2.php',
            titulo: 'Intranet',
            descripcion: 'Intranet UPT'
        },
        {
            url: 'https://aulavirtual.upt.edu.pe/pregrado/',
            titulo: 'Aula Virtual',
            descripcion: 'Aula Virtual UPT'
        },
        {
            url: 'https://idiomas.upt.edu.pe',
            titulo: 'Centro de Idiomas',
            descripcion: 'Centro de Idiomas UPT'
        }
        ]
    },
    {
        id: 'servicios',
        titulo: 'Servicios Estudiantiles',
        descripcion: 'Recursos y apoyo al estudiante',
        icono: <LayoutGrid size={20} />,
        color: 'green',
        enlaces: [
            {
                url: 'https://https://uptvirtual.upt.edu.pe',
                titulo: 'UPT Virtual',
                descripcion: 'UPT Virtual'
            },
            {
                url: 'https://www.upt.edu.pe/upt/web/home/contenido/247/25644531',
                titulo: 'Clínica Odontológica',
                descripcion: 'Clínica Odontológica'
            },
            {
                url: 'https://biblioteca.upt.edu.pe/net/buscar/index.php',
                titulo: 'Préstamos y Reserva de Libros',
                descripcion: 'Préstamos y Reserva de Libros'
            },
        
        ]
    },
    {
        id: 'gestion',
        titulo: 'Oficinas',
        descripcion: 'Vicerrectorado Académico',
        icono: <LayoutGrid size={20} />,
        color: 'purple',
        enlaces: [
        {
            url: 'https://www.upt.edu.pe/upt/web/home/contenido/22/57842712',
            titulo: 'Secretaría General',
            descripcion: 'Secretaría General'
        },
        {
            url: 'https://www.upt.edu.pe/upt/web/home/contenido/106/36834106',
            titulo: 'Oficina de Control Interno',
            descripcion: 'Oficina de Control Interno'
        },
        {
            url: 'https://www.upt.edu.pe/upt/web/home/contenido/100/21725158',
            titulo: 'Portal de Transparencia',
            descripcion: 'Información institucional pública'
        },
        {
            url: 'https://www.upt.edu.pe/upt/web/home/contenido/102/86094055',
            titulo: 'Convenios Internacionales',
            descripcion: 'Programas de intercambio'
        },
        ]
    },
    {
        id: 'formatos',
        titulo: 'Formatos de documentos',
        descripcion: 'Formatos y documentos descargables',
        icono: <LayoutGrid size={20} />,
        color: 'orange',
        enlaces: [
            {
            url: '/docs/formatos/FUT-UPT01.pdf',
            titulo: 'Formato FUT',
            descripcion: 'Formato Único de Trámite (PDF)'
            },
            {
            url: '/docs/formatos/FORMATO_RECTIFICACION.xlsx',
            titulo: 'Ficha de Rectificación',
            descripcion: 'Rectificación de matrícula (Excel)'
            },            
        ]
    },
    {
        id: 'guias',
        titulo: 'Guías y Manuales',
        descripcion: 'Formatos y documentos descargables',
        icono: <LayoutGrid size={20} />,
        color: 'brown',
        enlaces: [
            {
            url: '/docs/guias/GUIA_RAPIDA_FICHA_ACTUALIZACION_DATOS.pdf',
            titulo: 'Ficha de Actualización de Datos',
            descripcion: 'Formato Único de Trámite (PDF)'
            },
            {
            url: '/docs/formatos/FORMATO_RECTIFICACION.xlsx',
            titulo: 'Ficha de Rectificación',
            descripcion: 'Rectificación de matrícula (Excel)'
            },
            {
            url: '/docs/guias/PREGUNTAS_FRECUENTES_2025-II_REGULARES_FINAL_180725.pdf',
            titulo: 'Preguntas Frecuentes',
            descripcion: 'Preguntas Frecuentes 2025-II (PDF)'
            },
            {
            url: '/docs/guias/MU_Web_Matricula_Estudiante_V4.1.pdf',
            titulo: 'Matrícula Virtual',
            descripcion: 'Matrícula WEB - Estudiante (PDF)'
            },
        ]
    },
    {
        id: 'otros',
        titulo: 'Otros Documentos',
        descripcion: 'Formatos y documentos descargables',
        icono: <LayoutGrid size={20} />,
        color: 'red',
        enlaces: [
            {
            url: '/docs/guias/UPT_Bienvenidos2025.pdf',
            titulo: 'Bienvenidos UPT',
            descripcion: 'Tienda Virtual UPT (PDF)'
            },
            {
            url: '/docs/guias/Catalogo_UPT_Merch_2025.pdf',
            titulo: 'UPT MERCH',
            descripcion: 'Tienda Virtual UPT (PDF)'
            },
            {
            url: '/docs/guias/MedioPe.pdf',
            titulo: 'MEDIO.PE',
            descripcion: 'Dedimooctava edición (PDF)'
            },
            {
            url: '/docs/guias/CERTIFICADO_ISO_9001_2015.pdf',
            titulo: 'Certificaciones CERTHIA',
            descripcion: 'Certificado obtenido en ISO 9001:2015 otorgado por la empresa certificadora CERTHIA (PDF)'
            },            
        ]
    },    
];

const getColorClass = (color: string) => {
  switch (color) {
    case 'blue': return 'home-categoria-blue';
    case 'green': return 'home-categoria-green';
    case 'purple': return 'home-categoria-purple';
    case 'orange': return 'home-categoria-orange';
    case 'red': return 'home-categoria-red';
    case 'brown': return 'home-categoria-brown';
    default: return 'home-categoria-blue';
  }
};

export const EnlacesUtiles: React.FC = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);

  const abrirModal = (categoria: Categoria) => {
    setCategoriaSeleccionada(categoria);
  };

  const cerrarModal = () => {
    setCategoriaSeleccionada(null);
  };

  return (
    <>
      <section className="home-column" aria-labelledby="enlaces-utiles-title">
        <header className="home-section-header">
          <div className="home-section-header-icon">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h2 id="enlaces-utiles-title">Enlaces Útiles UPT</h2>
            <p>Acceso organizado a todas las plataformas universitarias</p>
          </div>
        </header>

        <div className="home-categorias-grid">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              className={`home-categoria-card ${getColorClass(categoria.color)}`}
              onClick={() => abrirModal(categoria)}
            >
              <div className="home-categoria-icon">
                {categoria.icono}
              </div>
              <div className="home-categoria-content">
                <h3>{categoria.titulo}</h3>
                <p>{categoria.descripcion}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Modal de enlaces */}
      {categoriaSeleccionada && (
        <div className="home-enlaces-modal-overlay" onClick={cerrarModal}>
          <div className="home-enlaces-modal" onClick={(e) => e.stopPropagation()}>
            <div className="home-enlaces-modal-header">
              <h3>{categoriaSeleccionada.titulo}</h3>
              <button 
                className="home-enlaces-modal-close"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="home-enlaces-modal-content">
              <p className="home-enlaces-modal-descripcion">
                {categoriaSeleccionada.descripcion}
              </p>
              
              <div className="home-enlaces-lista">
                {categoriaSeleccionada.enlaces.map((enlace, index) => (
                  <a
                    key={index}
                    href={enlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-enlace-item"
                  >
                    <div className="home-enlace-info">
                      <span className="home-enlace-titulo">{enlace.titulo}</span>
                      {enlace.descripcion && (
                        <span className="home-enlace-descripcion">{enlace.descripcion}</span>
                      )}
                    </div>
                    <ExternalLink size={16} className="home-enlace-external" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};