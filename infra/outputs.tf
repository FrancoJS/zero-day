output "ip_publica" {
  description = "IP pública (EIP) del servidor."
  value       = huaweicloud_vpc_eip.eip.address
}

# Las imágenes públicas de Ubuntu en Huawei Cloud entran como root con key pair
output "comando_ssh" {
  description = "Comando para entrar al servidor por SSH."
  value       = "ssh root@${huaweicloud_vpc_eip.eip.address}"
}

output "url_app" {
  description = "URL de la app una vez corrido setup.sh."
  value       = "http://${huaweicloud_vpc_eip.eip.address}/"
}

output "siguiente_paso" {
  description = "Qué hacer después del apply."
  value       = "Copiar setup.sh con scp, configurar la deploy key (infra/README.md) y correr: sudo bash setup.sh"
}
