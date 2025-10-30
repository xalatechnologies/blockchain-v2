# Infrastructure Documentation

This document provides an overview of the infrastructure automation included in this project.

## Overview

The project includes two approaches for deploying and managing the blockchain infrastructure:

1. **Docker-based deployment** - Using `docker-compose.yml` for local development and testing
2. **Ansible automation** - For production deployments and infrastructure management

## Ansible Automation

The Ansible automation is organized in the `infrastructure/ansible` directory with the following structure:

```
infrastructure/ansible/
├── ansible.cfg              # Ansible configuration
├── group_vars/              # Variables for host groups
│   └── all.yml             # Global variables
├── inventory/               # Inventory files
│   └── hosts               # Host inventory
├── playbooks/              # Ansible playbooks
│   ├── connect-to-network.yml  # Connect to existing network
│   ├── setup-all.yml       # Complete setup
│   └── templates/          # Template files
│       └── bitcoinbrd.service.j2  # Systemd service template
└── roles/                  # Ansible roles (currently empty)
```

## Key Playbooks

### setup-all.yml

This playbook performs the basic setup of servers including:
- Installing required packages
- Creating the bitcoinbr user
- Setting up directory structure

### connect-to-network.yml

This playbook configures nodes to connect to the existing Bitcoin BR network:
- Configures node settings
- Sets up persistent peers
- Creates systemd service files

## Inventory Management

The inventory file at `infrastructure/ansible/inventory/hosts` defines the servers that Ansible will manage. By default, it's configured to work with the existing RPC endpoint at rpc.bitcoinbr.tech.

## Usage

### Prerequisites

1. Install Ansible 2.14+
2. Ensure SSH access to target servers
3. Configure SSH keys for authentication

### Running Playbooks

1. Navigate to the Ansible directory:
   ```bash
   cd infrastructure/ansible
   ```

2. Test connectivity:
   ```bash
   ansible all -m ping
   ```

3. Run setup:
   ```bash
   ansible-playbook playbooks/setup-all.yml
   ```

4. Connect to network:
   ```bash
   ansible-playbook playbooks/connect-to-network.yml
   ```

## Configuration Variables

Global variables are defined in `infrastructure/ansible/group_vars/all.yml` and include:
- Chain ID and network parameters
- Port configurations
- Token economics
- Service endpoints

## Extending the Infrastructure

To add more nodes to the infrastructure:

1. Update the inventory file with new hosts
2. Modify group variables as needed
3. Run the appropriate playbooks

## Security Considerations

- SSH keys should be properly secured
- Firewall rules should be configured appropriately
- Regular updates should be applied to all infrastructure components