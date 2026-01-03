import { Test, TestingModule } from '@nestjs/testing';
import { AlgorithmParserService } from './algorithm-parser.service';
import { AlgType } from '../types/enums';

describe('AlgorithmParserService', () => {
  let service: AlgorithmParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlgorithmParserService],
    }).compile();

    service = module.get<AlgorithmParserService>(AlgorithmParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseAlgorithmsText', () => {
    it('should parse a simple algorithm correctly', () => {
      const result = service.parseAlgorithmsText("R U R' U'");
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        originalMoves: "R U R' U'",
        normalizedMoves: "R U R' U'",
        moveCount: 4,
        algType: AlgType.OTHER,
        caseName: undefined,
      });
    });

    it('should parse algorithm with case name', () => {
      const result = service.parseAlgorithmsText("T-Perm: R U R' U'");
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        originalMoves: "R U R' U'",
        normalizedMoves: "R U R' U'",
        moveCount: 4,
        algType: AlgType.PLL,
        caseName: "T-Perm",
      });
    });

    it('should parse multiple algorithms', () => {
      const result = service.parseAlgorithmsText("R U R' U'\nF R F'");
      
      expect(result).toHaveLength(2);
      expect(result[0].originalMoves).toBe("R U R' U'");
      expect(result[1].originalMoves).toBe("F R F'");
    });

    it('should normalize wide moves', () => {
      const result = service.parseAlgorithmsText("Rw U Rw'");
      
      expect(result[0].normalizedMoves).toBe("Rw U Rw'");
    });

    it('should normalize double moves', () => {
      const result = service.parseAlgorithmsText("R2 U2 D2");
      
      expect(result[0].normalizedMoves).toBe("R2 U2 D2");
      expect(result[0].moveCount).toBe(3);
    });

    it('should normalize prime moves', () => {
      const result = service.parseAlgorithmsText("R' U' F'");
      
      expect(result[0].normalizedMoves).toBe("R' U' F'");
      expect(result[0].moveCount).toBe(3);
    });

    it('should remove rotation moves', () => {
      const result = service.parseAlgorithmsText("x R U R' x'");
      
      expect(result[0].normalizedMoves).toBe("R U R'");
      expect(result[0].moveCount).toBe(3);
    });

    it('should handle empty input', () => {
      const result = service.parseAlgorithmsText("");
      
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only input', () => {
      const result = service.parseAlgorithmsText("   ");
      
      expect(result).toEqual([]);
    });

    it('should skip empty lines', () => {
      const result = service.parseAlgorithmsText("R U R'\n\n  \nF R F'");
      
      expect(result).toHaveLength(2);
    });
  });

  describe('extractNgrams', () => {
    it('should extract n-grams with default length (4-6)', () => {
      const ngrams = service.extractNgrams("R U R' U'");
      
      expect(ngrams).toContain("R U R' U'");
      expect(ngrams.length).toBeGreaterThan(0);
    });

    it('should extract 2-grams when specified', () => {
      const ngrams = service.extractNgrams("R U R' U'", 2, 2);
      
      expect(ngrams).toContain("R U");
      expect(ngrams).toContain("U R'");
      expect(ngrams).toContain("R' U'");
      expect(ngrams.length).toBe(3);
    });

    it('should extract 3-grams when specified', () => {
      const ngrams = service.extractNgrams("R U R' U'", 3, 3);
      
      expect(ngrams).toContain("R U R'");
      expect(ngrams).toContain("U R' U'");
      expect(ngrams.length).toBe(2);
    });

    it('should handle short algorithms with custom min length', () => {
      const ngrams = service.extractNgrams("R U", 2, 2);
      
      expect(ngrams).toContain("R U");
      expect(ngrams.length).toBe(1);
    });

    it('should handle single move with custom min length', () => {
      const ngrams = service.extractNgrams("R", 1, 1);
      
      expect(ngrams).toEqual(["R"]);
    });

    it('should return empty array for short input with default min length', () => {
      const ngrams = service.extractNgrams("R U");
      
      expect(ngrams).toEqual([]);
    });

    it('should handle empty input', () => {
      const ngrams = service.extractNgrams("");
      
      expect(ngrams).toEqual([]);
    });

    it('should extract multiple lengths', () => {
      const ngrams = service.extractNgrams("R U R' U' F R F'", 2, 3);
      
      expect(ngrams.length).toBeGreaterThan(0);
      expect(ngrams).toContain("R U"); // 2-gram
      expect(ngrams).toContain("R U R'"); // 3-gram
    });
  });

  describe('algorithm classification', () => {
    it('should classify PLL algorithms', () => {
      const result = service.parseAlgorithmsText("T-Perm: R U R' F' R U R' U' R' F R2 U' R'");
      expect(result[0].algType).toBe(AlgType.PLL);
    });

    it('should classify OLL algorithms', () => {
      const result = service.parseAlgorithmsText("OLL 57: F R U R' U' F'");
      expect(result[0].algType).toBe(AlgType.OLL);
    });

    it('should classify F2L algorithms', () => {
      const result = service.parseAlgorithmsText("F2L Case 1: R U R'");
      expect(result[0].algType).toBe(AlgType.F2L);
    });

    it('should classify CMLL algorithms', () => {
      const result = service.parseAlgorithmsText("CMLL T: R U R' U R U2 R'");
      expect(result[0].algType).toBe(AlgType.CMLL);
    });

    it('should classify COLL algorithms', () => {
      const result = service.parseAlgorithmsText("COLL H: R U2 R' U' R U' R'");
      expect(result[0].algType).toBe(AlgType.COLL);
    });

    it('should classify ZBLL algorithms', () => {
      const result = service.parseAlgorithmsText("ZBLL T: R U R' U R U2 R'");
      expect(result[0].algType).toBe(AlgType.ZBLL);
    });

    it('should classify LSE algorithms', () => {
      const result = service.parseAlgorithmsText("LSE EO: M U M' U2 M U M'");
      expect(result[0].algType).toBe(AlgType.LSE);
    });

    it('should default to OTHER for unknown cases', () => {
      const result = service.parseAlgorithmsText("Unknown Case: R U R'");
      expect(result[0].algType).toBe(AlgType.OTHER);
    });

    it('should default to OTHER when no case name provided', () => {
      const result = service.parseAlgorithmsText("R U R'");
      expect(result[0].algType).toBe(AlgType.OTHER);
    });
  });

  describe('complex algorithms', () => {
    it('should handle T-Perm correctly', () => {
      const tPerm = "T-Perm: R U R' F' R U R' U' R' F R2 U' R'";
      const result = service.parseAlgorithmsText(tPerm);
      
      expect(result[0].originalMoves).toBe("R U R' F' R U R' U' R' F R2 U' R'");
      expect(result[0].normalizedMoves).toBe("R U R' F' R U R' U' R' F R2 U' R'");
      expect(result[0].moveCount).toBe(13);
      expect(result[0].algType).toBe(AlgType.PLL);
      expect(result[0].caseName).toBe("T-Perm");
    });

    it('should handle Y-Perm correctly', () => {
      const yPerm = "Y-Perm: F R U' R' U' R U R' F' R U R' U' R' F R F'";
      const result = service.parseAlgorithmsText(yPerm);
      
      expect(result[0].moveCount).toBe(17);
      expect(result[0].algType).toBe(AlgType.PLL);
    });

    it('should handle OLL with rotations', () => {
      const oll = "OLL 43: x R' U R D' R' U' R D x'";
      const result = service.parseAlgorithmsText(oll);
      
      expect(result[0].normalizedMoves).toBe("R' U R D' R' U' R D");
      expect(result[0].algType).toBe(AlgType.OLL);
    });
  });
});