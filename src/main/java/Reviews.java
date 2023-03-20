import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "Reviews")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Reviews {
    public Reviews(String body) {
        this.body = body;
    }

    @Id
    private ObjectId id;
    private String body;
}
