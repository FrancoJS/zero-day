# Un solo ECS Ubuntu con EIP. Todo corre adentro con Docker Compose (ver setup.sh).
# Cobro por uso (postpaid): no se crea nada prepago.

data "huaweicloud_availability_zones" "zonas" {}

locals {
  zona = data.huaweicloud_availability_zones.zonas.names[0]
}

# Flavor de uso general x86 con 2 vCPU y 4 GiB en la zona elegida (se toma el primero)
data "huaweicloud_compute_flavors" "flavor" {
  availability_zone = local.zona
  performance_type  = "normal"
  cpu_core_count    = 2
  memory_size       = 4
}

# Imagen pública de Ubuntu más reciente que calce con el regex
data "huaweicloud_images_image" "ubuntu" {
  name_regex   = var.nombre_imagen_regex
  visibility   = "public"
  architecture = "x86"
  most_recent  = true
}

# --- Red ---
resource "huaweicloud_vpc" "vpc" {
  name = "${var.prefijo}-vpc"
  cidr = "192.168.0.0/16"
}

resource "huaweicloud_vpc_subnet" "subred" {
  name       = "${var.prefijo}-subred"
  vpc_id     = huaweicloud_vpc.vpc.id
  cidr       = "192.168.1.0/24"
  gateway_ip = "192.168.1.1"
}

# --- Security group: solo 22 (SSH) y 80 (web). El backend y la BD NO se exponen ---
resource "huaweicloud_networking_secgroup" "sg" {
  name        = "${var.prefijo}-sg"
  description = "SSH y HTTP para Zero Day"
}

resource "huaweicloud_networking_secgroup_rule" "ssh" {
  security_group_id = huaweicloud_networking_secgroup.sg.id
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  ports             = "22"
  remote_ip_prefix  = var.cidr_ssh
  description       = "SSH"
}

resource "huaweicloud_networking_secgroup_rule" "http" {
  security_group_id = huaweicloud_networking_secgroup.sg.id
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  ports             = "80"
  remote_ip_prefix  = "0.0.0.0/0"
  description       = "Web"
}

# --- Acceso SSH con clave pública ---
resource "huaweicloud_kps_keypair" "clave" {
  name       = "${var.prefijo}-clave"
  public_key = file(pathexpand(var.ruta_clave_publica))
}

# --- Servidor ---
resource "huaweicloud_compute_instance" "servidor" {
  name               = "${var.prefijo}-servidor"
  availability_zone  = local.zona
  flavor_id          = data.huaweicloud_compute_flavors.flavor.ids[0]
  image_id           = data.huaweicloud_images_image.ubuntu.id
  key_pair           = huaweicloud_kps_keypair.clave.name
  security_group_ids = [huaweicloud_networking_secgroup.sg.id]
  charging_mode      = "postPaid"

  system_disk_type = "GPSSD"
  system_disk_size = var.tamano_disco_gb

  network {
    uuid = huaweicloud_vpc_subnet.subred.id
  }
}

# --- IP pública (cobro por tráfico) ---
resource "huaweicloud_vpc_eip" "eip" {
  name          = "${var.prefijo}-eip"
  charging_mode = "postPaid"

  publicip {
    type = var.tipo_eip
  }

  bandwidth {
    name        = "${var.prefijo}-ancho-banda"
    share_type  = "PER"
    charge_mode = "traffic"
    size        = var.ancho_banda_mbit
  }
}

resource "huaweicloud_compute_eip_associate" "asociacion" {
  public_ip   = huaweicloud_vpc_eip.eip.address
  instance_id = huaweicloud_compute_instance.servidor.id
}
