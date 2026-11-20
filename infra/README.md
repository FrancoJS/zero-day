# Infra (Terraform, Huawei Cloud)

Crea **un solo ECS Ubuntu** (2 vCPU, 4 GiB, Santiago `la-south-2`) con EIP y security group con **22 y 80** (el backend y la BD no se exponen). Cobro por uso.

## Requisitos

- Terraform con mise (`mise exec terraform -- terraform ...`).
- Una clave SSH **pública** (por defecto `~/.ssh/id_ed25519.pub`; otra ruta con `-var ruta_clave_publica=...`).
- Credenciales de Huawei exportadas **en tu propia terminal** (nunca pegarlas en chats ni agentes):

  ```bash
  read -rs HW_ACCESS_KEY; read -rs HW_SECRET_KEY   # no se muestran
  export HW_ACCESS_KEY HW_SECRET_KEY HW_REGION_NAME=la-south-2
  ```

Opcional: restringir SSH a tu IP con `-var cidr_ssh=TU.IP/32`.

## Pasos

```bash
cd infra
terraform init
terraform plan -out plan.tfplan   # revisar el plan con el equipo
terraform apply plan.tfplan       # solo después de confirmar el plan
terraform output                  # ip_publica, comando_ssh, url_app
```

Terraform crea **solo el servidor** (no ejecuta `setup.sh`: así la key de Kostra no queda en los metadatos ni en el `tfstate`). Luego, con el repo **público**:

```bash
ssh root@<ip_publica>      # si no entra: ssh ubuntu@<ip_publica>, o "Remote Login" en la consola del ECS
curl -fsSLO https://raw.githubusercontent.com/<usuario>/<repo>/main/setup.sh
sudo REPO_URL=https://github.com/<usuario>/<repo>.git bash setup.sh
```

Reglas: correr Terraform **solo en el PC del líder** (ahí quedan el `tfstate` y la clave SSH), cargar las credenciales con `read -rsp` **una línea a la vez** en una pestaña separada de la del agente, mostrar el `plan` y confirmar antes de `apply`/`destroy`. Si en 15 minutos no funciona, crear el ECS por consola y seguir con `setup.sh`.

## Respaldo: repo privado (deploy key + setup.sh)

Solo si el repo no es público. El servidor necesita permiso de **solo lectura** para clonar.

```bash
# 1) En tu PC: copiar el script al servidor
scp setup.sh <usuario>@<ip>:/tmp/setup.sh

# 2) En el servidor: crear la clave de root (setup.sh corre como root) y mostrar la pública
sudo ssh-keygen -t ed25519 -N "" -f /root/.ssh/id_ed25519 -C "servidor-zero-day"
sudo cat /root/.ssh/id_ed25519.pub

# 3) En tu PC: registrarla como deploy key de solo lectura (pegar la línea pública)
gh repo deploy-key add - --repo FrancoJS/zero-day-base --title servidor-zero-day <<< "ssh-ed25519 AAAA... servidor-zero-day"

# 4) En el servidor: aceptar la huella de GitHub y correr el script
sudo ssh -o StrictHostKeyChecking=accept-new -T git@github.com   # debe decir "successfully authenticated"
sudo bash /tmp/setup.sh            # otro repo: sudo REPO_URL=git@github.com:<usuario>/<repo>.git bash /tmp/setup.sh
```

Al terminar una prueba: borrar la deploy key (`gh repo deploy-key list` / `gh repo deploy-key delete <id>`) y eliminar el servidor.

Abrir `http://<ip_publica>/`.

## Costos y limpieza

El ECS y la EIP cobran por hora; **la EIP puede cobrar aunque el ECS esté apagado**. Al terminar:

```bash
terraform plan -destroy   # revisar qué se borra
terraform destroy         # solo después de confirmar
```

Si el apply falla por el tipo de EIP, probar `-var tipo_eip=5_sbgp` (ver la consola de la región).
