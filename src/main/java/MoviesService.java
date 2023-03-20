import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MoviesService {
    @Autowired
    private MoviesRepository movieRepository;
    public List<Movies> allMovies() {
        return movieRepository.findAll();
    }

    public Optional<Movies> getSingleMovie(ObjectId id) {
        return movieRepository.findById(id);
    }

    public Optional<Movies> getMovieByImdbId(String imdbId) {
        return movieRepository.findByImdbId(imdbId);
    }
}
