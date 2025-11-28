import React from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UsuarioRole } from "../usuariosService";
import type { CatalogosData, UsuarioFormValues } from "../types";
import { CONTRATOS_DESCRIPTIVOS, TURNOS_DESCRIPTIVOS } from "../types";
import { sortCatalogByNombre } from "../mappers";

interface UsuarioFormProps {
  role: UsuarioRole;
  values: UsuarioFormValues;
  onChange: (field: keyof UsuarioFormValues, value: string) => void;
  catalogs: CatalogosData;
  mode: "create" | "edit";
}

const GENERO_OPTIONS = [
  { value: "", label: "No especificar" },
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" }
];

const renderLabel = (role: UsuarioRole): string => {
  switch (role) {
    case "estudiante":
      return "Codigo de estudiante";
    case "docente":
      return "Codigo de docente";
    default:
      return "Codigo interno";
  }
};

export const UsuarioForm: React.FC<UsuarioFormProps> = ({
  role,
  values,
  onChange,
  catalogs,
  mode
}) => {
  const tiposDoc = sortCatalogByNombre(catalogs.tiposDocumento);
  const roles = sortCatalogByNombre(catalogs.roles);
  const rolesAdministrativos = React.useMemo(
    () =>
      roles.filter((rol) => {
        const nombre = rol.nombre.toLowerCase();
        return nombre === "administrador" || nombre === "supervisor";
      }),
    [roles]
  );
  const escuelas = sortCatalogByNombre(catalogs.escuelas);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    setShowPassword(false);
  }, [mode, values.password]);

  return (
    <div className="usuario-form-grid">
      <div className="usuario-form-section">
        <h3 className="usuario-form-title">Datos personales</h3>
        <div className="usuario-form-row">
          <label>
            Nombres
            <input
              type="text"
              value={values.nombre}
              maxLength={25}
              onChange={(event) => onChange("nombre", event.target.value)}
              placeholder="Ej. Dayan"
            />
          </label>
          <label>
            Apellidos
            <input
              type="text"
              value={values.apellido}
              maxLength={25}
              onChange={(event) => onChange("apellido", event.target.value)}
              placeholder="Ej. Mamani Quispe"
            />
          </label>
        </div>
        <div className="usuario-form-row">
          <label>
            Tipo de documento
            <select
              value={values.idTipoDoc}
              onChange={(event) => onChange("idTipoDoc", event.target.value)}
            >
              <option value="">Selecciona una opcion</option>
              {tiposDoc.map((tipo) => (
                <option key={tipo.idTipoDoc} value={tipo.idTipoDoc}>
                  {tipo.abreviatura ? `${tipo.abreviatura} - ${tipo.nombre}` : tipo.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Numero de documento
            <input
              type="text"
              value={values.numDoc}
              maxLength={20}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) => onChange("numDoc", event.target.value)}
              placeholder="Ingresa el numero"
            />
          </label>
        </div>
        <div className="usuario-form-row">
          <label>
            Celular
            <input
              type="tel"
              value={values.celular}
              maxLength={9}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) => onChange("celular", event.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label>
            Genero
            <select
              value={values.genero}
              onChange={(event) => onChange("genero", event.target.value as UsuarioFormValues["genero"])}
            >
              {GENERO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="usuario-form-section">
        <h3 className="usuario-form-title">Credenciales de acceso</h3>
        <div className="usuario-form-row">
          <label>
            Correo institucional
            <input
              type="email"
              value={values.correo}
              maxLength={27}
              onChange={(event) => onChange("correo", event.target.value)}
              placeholder="usuario@upt.pe"
            />
          </label>
        </div>
        <div className="usuario-form-row">
          <label>
            Contraseña {mode === "edit" && <span className="usuario-form-hint">(opcional)</span>}
            <div className="usuario-form-password">
              <input
                type={mode === "edit" && showPassword ? "text" : "password"}
                value={values.password}
                maxLength={100}
                onChange={(event) => onChange("password", event.target.value)}
                placeholder={
                  mode === "create"
                    ? "Minimo 6 caracteres"
                    : values.password
                    ? "Contraseña actual"
                    : "Dejar en blanco para no cambiar"
                }
              />
              {mode === "edit" && values.password && (
                <button
                  type="button"
                  className="usuario-form-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </label>
        </div>
      </div>

      {role !== "administrativo" && (
        <div className="usuario-form-section">
          <h3 className="usuario-form-title">Vinculacion academica</h3>
          <div className="usuario-form-row">
            <label>
              Escuela profesional
              <select
                value={values.idEscuela}
                onChange={(event) => onChange("idEscuela", event.target.value)}
              >
                <option value="">
                  {role === "docente" ? "Selecciona una escuela" : "Selecciona una escuela"}
                </option>
                {escuelas.map((escuela) => (
                  <option key={escuela.idEscuela} value={escuela.idEscuela}>
                    {escuela.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {renderLabel(role)}
              <input
                type="text"
                value={values.codigoGenerico}
                maxLength={role === "estudiante" ? 10 : 20}
                inputMode={role === "estudiante" ? "numeric" : undefined}
                pattern={role === "estudiante" ? "[0-9]*" : undefined}
                onChange={(event) => onChange("codigoGenerico", event.target.value)}
                placeholder={role === "docente" ? "Ej. DOC-2024-01" : "Ej. 2023076808"}
              />
            </label>
          </div>
          {role === "docente" && (
            <>
              <div className="usuario-form-row">
                <label>
                  Tipo de contrato
                  <select
                    value={values.tipoContrato}
                    onChange={(event) => onChange("tipoContrato", event.target.value)}
                  >
                    <option value="">Selecciona una opcion</option>
                    {CONTRATOS_DESCRIPTIVOS.map((contrato) => (
                      <option key={contrato} value={contrato}>
                        {contrato}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Especialidad
                  <input
                    type="text"
                    value={values.especialidad}
                    onChange={(event) => onChange("especialidad", event.target.value)}
                    placeholder="Ej. Redes y Telecomunicaciones"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {role === "administrativo" && (
        <div className="usuario-form-section">
          <h3 className="usuario-form-title">Informacion laboral</h3>
          <div className="usuario-form-row">
            <label>
              Rol administrativo
              <select value={values.idRol} onChange={(event) => onChange("idRol", event.target.value)}>
                <option value="">Selecciona un rol</option>
                {rolesAdministrativos.map((rol) => (
                  <option key={rol.idRol} value={rol.idRol}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Turno
              <select value={values.turno} onChange={(event) => onChange("turno", event.target.value)}>
                <option value="">Selecciona un turno</option>
                {TURNOS_DESCRIPTIVOS.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="usuario-form-row">
          <label>
              Escuela (opcional)
              <select value={values.idEscuela} onChange={(event) => onChange("idEscuela", event.target.value)}>
                <option value="">Sin asignar</option>
                {escuelas.map((escuela) => (
                  <option key={escuela.idEscuela} value={escuela.idEscuela}>
                    {escuela.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Extension telefonica
              <input
                type="text"
                value={values.extension}
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(event) => onChange("extension", event.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
