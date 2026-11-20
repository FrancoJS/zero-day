terraform {
  required_version = ">= 1.5"

  required_providers {
    huaweicloud = {
      source  = "huaweicloud/huaweicloud"
      version = "~> 1.0"
    }
  }
}

# Sin keys: las credenciales se leen de HW_ACCESS_KEY y HW_SECRET_KEY (entorno).
provider "huaweicloud" {
  region = var.region
}
