-- Create a table
CREATE TABLE example_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Insert some records
INSERT INTO example_table (name) VALUES ('Record 1: Hello');
INSERT INTO example_table (name) VALUES ('Record 2: World');
