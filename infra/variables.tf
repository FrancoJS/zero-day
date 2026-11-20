variable "region" {
  description = "Región de Huawei Cloud (la-south-2 = Santiago)."
  type        = string
  default     = "la-south-2"
}

variable "prefijo" {
  description = "Prefijo para los nombres de todos los recursos."
  type        = string
  default     = "zeroday"
}

variable "ruta_clave_publica" {
  description = "Ruta a la clave SSH PÚBLICA (.pub) que se carga en el servidor. Nunca la privada."
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "cidr_ssh" {
  description = "Origen permitido para SSH (puerto 22). Recomendado: la IP del equipo con /32 (ej. 200.1.2.3/32)."
  type        = string
  default     = "0.0.0.0/0"
}

variable "tamano_disco_gb" {
  description = "Tamaño del disco de sistema en GB."
  type        = number
  default     = 40
}

variable "ancho_banda_mbit" {
  description = "Ancho de banda de la EIP en Mbit/s (cobro por tráfico)."
  type        = number
  default     = 5
}

variable "tipo_eip" {
  description = "Tipo de EIP. Algunas regiones usan \"5_sbgp\" en vez de \"5_bgp\": si el apply falla por el tipo, revisarlo en la consola."
  type        = string
  default     = "5_bgp"
}

variable "nombre_imagen_regex" {
  description = "Regex del nombre de la imagen pública de Ubuntu (se toma la más reciente)."
  type        = string
  default     = "^Ubuntu 22\\.04 server 64bit"
}
