// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DNABridge
 * @notice Genetic algorithm-based bridge with mutation and evolution
 * @dev Transfers "evolve" over generations to find optimal path
 * 
 * GENIUS TRICK: Token transfers have DNA that mutates and evolves!
 * Survival of the fittest - best transfers reproduce
 */
contract DNABridge {
    
    IERC20 public immutable btcbr;
    
    struct TransferGene {
        bytes32 dna;             // 256-bit genetic code
        uint256 fitness;         // How successful (speed + cost + security)
        uint256 generation;      // Which generation
        bytes32 parent1;         // First parent
        bytes32 parent2;         // Second parent (optional)
        uint256 mutations;       // How many mutations
        bool alive;              // Still viable
        uint256 offspring;       // How many children spawned
    }
    
    mapping(bytes32 => TransferGene) public genes;
    mapping(uint256 => bytes32[]) public generations; // Generation => Transfer IDs
    
    uint256 public currentGeneration;
    uint256 public constant MUTATION_RATE = 5; // 5% chance per gene
    
    event TransferBorn(bytes32 indexed geneId, uint256 generation, bytes32 parent1, bytes32 parent2);
    event Mutation(bytes32 indexed geneId, uint256 position);
    event Evolution(uint256 indexed generation, bytes32 fittest);
    
    constructor(address _btcbr) {
        btcbr = IERC20(_btcbr);
    }
    
    /**
     * @notice Create genesis transfer (generation 0)
     */
    function genesis(uint256 amount, bytes32 initialDNA) external returns (bytes32 geneId) {
        require(btcbr.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        geneId = keccak256(abi.encodePacked(initialDNA, block.timestamp, uint256(0)));
        
        genes[geneId] = TransferGene({
            dna: initialDNA,
            fitness: 100, // Starting fitness
            generation: 0,
            parent1: bytes32(0),
            parent2: bytes32(0),
            mutations: 0,
            alive: true,
            offspring: 0
        });
        
        generations[0].push(geneId);
        
        emit TransferBorn(geneId, 0, bytes32(0), bytes32(0));
    }
    
    /**
     * @notice Breed two transfers to create offspring
     * Combines DNA from both parents with crossover
     */
    function breed(bytes32 parent1Id, bytes32 parent2Id) external returns (bytes32 childId) {
        TransferGene storage p1 = genes[parent1Id];
        TransferGene storage p2 = genes[parent2Id];
        
        require(p1.alive && p2.alive, "Parents must be alive");
        
        // Crossover: take bits from both parents
        bytes32 childDNA = _crossover(p1.dna, p2.dna);
        
        // Mutation: random bit flips
        childDNA = _mutate(childDNA);
        
        childId = keccak256(abi.encodePacked(childDNA, block.timestamp, currentGeneration + 1));
        
        uint256 newGen = currentGeneration + 1;
        
        genes[childId] = TransferGene({
            dna: childDNA,
            fitness: (p1.fitness + p2.fitness) / 2, // Average of parents
            generation: newGen,
            parent1: parent1Id,
            parent2: parent2Id,
            mutations: 0,
            alive: true,
            offspring: 0
        });
        
        p1.offspring++;
        p2.offspring++;
        
        generations[newGen].push(childId);
        
        if (newGen > currentGeneration) {
            currentGeneration = newGen;
        }
        
        emit TransferBorn(childId, newGen, parent1Id, parent2Id);
    }
    
    /**
     * @notice Natural selection - kill unfit transfers
     */
    function naturalSelection(bytes32 geneId) external {
        TransferGene storage gene = genes[geneId];
        require(gene.alive, "Already dead");
        require(gene.fitness < 50, "Too fit to die");
        
        gene.alive = false;
    }
    
    /**
     * @notice Evaluate fitness based on performance
     */
    function evaluateFitness(bytes32 geneId, uint256 speed, uint256 cost, uint256 security) external {
        TransferGene storage gene = genes[geneId];
        
        // Fitness = weighted average of metrics
        gene.fitness = (speed * 40 + (100 - cost) * 30 + security * 30) / 100;
    }
    
    /**
     * @notice Get fittest transfer in generation
     */
    function getFittest(uint256 generation) external view returns (bytes32 fittestId, uint256 fitness) {
        bytes32[] storage genTransfers = generations[generation];
        
        uint256 maxFitness = 0;
        bytes32 maxId;
        
        for (uint256 i = 0; i < genTransfers.length; i++) {
            TransferGene storage gene = genes[genTransfers[i]];
            if (gene.alive && gene.fitness > maxFitness) {
                maxFitness = gene.fitness;
                maxId = genTransfers[i];
            }
        }
        
        return (maxId, maxFitness);
    }
    
    /**
     * @notice Genetic crossover - combine parent DNAs
     */
    function _crossover(bytes32 dna1, bytes32 dna2) internal view returns (bytes32) {
        // Single-point crossover
        uint256 crossoverPoint = uint256(keccak256(abi.encodePacked(block.timestamp))) % 256;
        
        uint256 mask = (1 << crossoverPoint) - 1;
        
        return bytes32((uint256(dna1) & ~mask) | (uint256(dna2) & mask));
    }
    
    /**
     * @notice Mutation - random bit flips
     */
    function _mutate(bytes32 dna) internal returns (bytes32) {
        uint256 mutated = uint256(dna);
        uint256 mutationCount = 0;
        
        for (uint256 i = 0; i < 256; i++) {
            uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, i, dna))) % 100;
            
            if (random < MUTATION_RATE) {
                mutated ^= (1 << i); // Flip bit
                mutationCount++;
                emit Mutation(dna, i);
            }
        }
        
        return bytes32(mutated);
    }
    
    /**
     * @notice Decode DNA into transfer parameters
     * DNA encodes: route, fees, speed preferences, etc.
     */
    function decodeDNA(bytes32 dna) external pure returns (
        uint8 route,
        uint8 feePreference,
        uint8 speedPreference,
        uint8 securityLevel
    ) {
        route = uint8(uint256(dna) >> 248);
        feePreference = uint8(uint256(dna) >> 240);
        speedPreference = uint8(uint256(dna) >> 232);
        securityLevel = uint8(uint256(dna) >> 224);
    }
}
