import { Injectable } from '@angular/core';
import neo4j, { Session } from 'neo4j-driver';

@Injectable({
  providedIn: 'root'
})
export class Neo4jService {

  private driver: any;

  constructor() {
    this.driver = neo4j.driver('neo4j+s://8fb721a1.databases.neo4j.io', neo4j.auth.basic('neo4j', 'P4geB7xYUpDyiIOCKYx0s61FPC68vmsTrpOltQ_Csz0'));
  }

  async testConnection(): Promise<boolean> {
    const session = this.driver.session();
    try {
      const result = await session.run('RETURN 1');
      return result.records.length > 0;
    } catch (error) {
      console.error('Error al conectar con Neo4j:', error);
      return false;
    } finally {
      await session.close();
    }
  }

  async consultar(query: string): Promise<any[]> {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(query);
      return result.records.map(record => record.toObject());
    } catch (error) {
      console.error('Error al ejecutar la consulta:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}
