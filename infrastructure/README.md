# Bitcoin BR Chain Infrastructure

This directory contains the infrastructure automation for the Bitcoin BR chain using Ansible.

## Directory Structure

```
infrastructure/
├── ansible/
│   ├── ansible.cfg          # Ansible configuration
│   ├── group_vars/          # Group variables
│   ├── inventory/           # Inventory files
│   ├── playbooks/           # Ansible playbooks
│   │   ├── setup-all.yml    # Complete setup playbook
│   │   ├── connect-to-network.yml  # Network connection playbook
│   │   └── templates/       # Template files
│   └── roles/               # Ansible roles (empty for now)
```

## Prerequisites

1. Ansible 2.14+ installed
2. SSH access to target servers
3. SSH key for authentication

## Usage

### 1. Verify Inventory

Check the inventory file at `ansible/inventory/hosts` to ensure it contains the correct server information.

### 2. Run Setup

```bash
cd infrastructure/ansible
ansible-playbook playbooks/setup-all.yml
```

### 3. Connect to Network

```bash
cd infrastructure/ansible
ansible-playbook playbooks/connect-to-network.yml
```

## Testing Connectivity

You can test connectivity to the existing network with:

```bash
# Test RPC endpoint
curl -s https://rpc.bitcoinbr.tech/status | jq

# Run Ansible ping test
cd infrastructure/ansible
ansible all -m ping
```