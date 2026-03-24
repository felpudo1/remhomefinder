import * as React from "react";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputPhoneProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "prefix"> {
  /**
   * Prefijo internacional a mostrar (ej: "+598" para Uruguay).
   * Por defecto se usa +598.
   */
  countryCode?: string;
  /**
   * Etiqueta para el input
   */
  label?: string;
  /**
   * Placeholder para la parte del número (sin prefijo)
   */
  placeholder?: string;
  /**
   * Si true, muestra un icono de teléfono a la izquierda del prefijo
   */
  showIcon?: boolean;
}

/**
 * Input de teléfono con prefijo internacional fijo visible.
 * El usuario solo ingresa el número sin el código de país.
 * El valor final se guarda con el prefijo incluido para formato internacional.
 *
 * @example
 * <InputPhone
 *   countryCode="+598"
 *   label="Teléfono de contacto"
 *   placeholder="99 123 456"
 *   value={phone}
 *   onChange={(e) => setPhone(e.target.value)}
 * />
 */
export const InputPhone = React.forwardRef<HTMLInputElement, InputPhoneProps>(
  (
    {
      countryCode = "+598",
      label,
      placeholder = "99 123 456",
      showIcon = true,
      className,
      id,
      disabled,
      value = "",
      onChange,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState("");

    // Sincronizar valor externo con el local
    React.useEffect(() => {
      // Si el valor externo ya tiene el prefijo, lo removemos para mostrar solo el número
      const valueStr = String(value || "");
      const prefixWithSpace = countryCode + " ";
      if (valueStr.startsWith(prefixWithSpace)) {
        setLocalValue(valueStr.slice(prefixWithSpace.length));
      } else if (valueStr.startsWith(countryCode)) {
        setLocalValue(valueStr.slice(countryCode.length));
      } else {
        setLocalValue(valueStr);
      }
    }, [value, countryCode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Solo permitir dígitos, espacios y guiones
      const sanitized = rawValue.replace(/[^\d\s-]/g, "");
      setLocalValue(sanitized);

      // Guardar con el prefijo internacional completo
      const fullValue = sanitized.trim()
        ? `${countryCode} ${sanitized.trim()}`
        : sanitized;

      if (onChange) {
        // Crear un evento sintético con el valor completo
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: fullValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    // Formatear para visualización mientras se escribe
    const formatPhoneNumber = (val: string) => {
      // Remover caracteres no numéricos excepto espacios
      const digits = val.replace(/[^\d]/g, "");

      // Formato Uruguay: XX XX XXX XXX (para números de 8 dígitos)
      if (countryCode === "+598" && digits.length === 8) {
        return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      }

      // Formato genérico con espacios cada 2-3 dígitos
      if (digits.length <= 4) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return digits.replace(/(\d{2,3})(?=\d)/g, "$1 ").trim();
    };

    const displayValue = formatPhoneNumber(localValue);

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {showIcon && (
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
          <div
            className={cn(
              "flex h-11 items-center rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              showIcon ? "pl-9" : "pl-3",
              className
            )}
          >
            <span className="text-foreground font-semibold whitespace-nowrap pr-2 border-r border-border mr-2">
              {countryCode}
            </span>
            <input
              id={id}
              ref={ref}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              disabled={disabled}
              value={displayValue}
              onChange={handleChange}
              placeholder={placeholder}
              className={cn(
                "flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground",
                "min-w-0"
              )}
              {...props}
            />
          </div>
        </div>
      </div>
    );
  }
);

InputPhone.displayName = "InputPhone";
